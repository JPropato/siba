import { Request, Response } from 'express';
import { z } from 'zod';
import { MedioPago, TipoCheque, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from '../finanzas/utils.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const chequeDataSchema = z.object({
  numero: z.string().min(1).max(30),
  tipo: z.nativeEnum(TipoCheque),
  bancoEmisor: z.string().min(1).max(100),
  fechaEmision: z.string().min(1),
  fechaCobro: z.string().min(1),
  monto: z.number().positive(),
  emisor: z.string().max(200).optional().nullable(),
});

const registrarCobroSchema = z.object({
  monto: z.number().positive(),
  fechaCobro: z.string().min(1),
  medioPago: z.nativeEnum(MedioPago),
  cuentaId: z.number().int().positive(),
  chequeData: chequeDataSchema.optional().nullable(),
  comprobanteCobro: z.string().max(100).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
});

// =====================================================
// COBROS DE FACTURA EMITIDA
// =====================================================

export const registrarCobro = async (req: Request, res: Response) => {
  try {
    const facturaId = Number(req.params.id);
    if (isNaN(facturaId)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }
    const data = registrarCobroSchema.parse(req.body);
    const userId = (req as Request & { user: { id: number } }).user.id;

    // Validate: if paying with CHEQUE/ECHEQ, chequeData is required
    if ((data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ') && !data.chequeData) {
      return res.status(400).json({
        error: 'Debe ingresar los datos del cheque al cobrar con cheque',
      });
    }

    // Validate cheque monto matches cobro monto when paying with cheque
    if (data.chequeData && (data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ')) {
      if (Math.abs(data.chequeData.monto - data.monto) > 0.01) {
        return res.status(400).json({
          error: 'El monto del cheque debe coincidir con el monto del cobro',
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate factura emitida (with row-level lock to prevent concurrent cobros)
      const lockedFacturas = await tx.$queryRaw<
        Array<{
          id: number;
          cliente_id: number;
          tipo_comprobante: string;
          punto_venta: number;
          numero_comprobante: string;
          total: string;
          monto_cobrado: string;
          saldo_pendiente: string;
          estado: string;
          cuenta_contable_id: number | null;
          centro_costo_id: number | null;
        }>
      >`
        SELECT id, cliente_id, tipo_comprobante, punto_venta, numero_comprobante,
               total::text, monto_cobrado::text, saldo_pendiente::text,
               estado, cuenta_contable_id, centro_costo_id
        FROM facturas_emitidas WHERE id = ${facturaId} FOR UPDATE
      `;

      const row = lockedFacturas[0];
      if (!row) {
        throw new Error('NOT_FOUND:Factura emitida no encontrada');
      }

      if (row.estado === 'ANULADA') {
        throw new Error('BAD_REQUEST:No se puede cobrar una factura anulada');
      }

      if (row.estado === 'COBRADA') {
        throw new Error('BAD_REQUEST:La factura ya esta completamente cobrada');
      }

      // Get client name
      const cliente = await tx.cliente.findUnique({
        where: { id: row.cliente_id },
        select: { razonSocial: true },
      });

      // 2. Validate amount
      const saldoPendiente = parseFloat(row.saldo_pendiente);
      if (data.monto > saldoPendiente + 0.01) {
        throw new Error(
          `BAD_REQUEST:El monto ($${data.monto}) supera el saldo pendiente ($${saldoPendiente})`
        );
      }

      // 3. Validate cuenta financiera
      const cuenta = await tx.cuentaFinanciera.findUnique({
        where: { id: data.cuentaId },
      });
      if (!cuenta || !cuenta.activa) {
        throw new Error('BAD_REQUEST:Cuenta financiera no encontrada o inactiva');
      }

      // 4. Auto-create cheque if paying with CHEQUE/ECHEQ
      // emisor = the client (who issued the cheque), beneficiario = null (our company)
      let chequeId: number | null = null;
      if (data.chequeData && (data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ')) {
        const cheque = await tx.cheque.create({
          data: {
            numero: data.chequeData.numero,
            tipo: data.chequeData.tipo,
            bancoEmisor: data.chequeData.bancoEmisor,
            fechaEmision: new Date(data.chequeData.fechaEmision),
            fechaCobro: new Date(data.chequeData.fechaCobro),
            monto: data.chequeData.monto,
            emisor: data.chequeData.emisor ?? cliente?.razonSocial ?? null,
            beneficiario: null,
            estado: 'CARTERA',
            observaciones: `Auto-creado desde cobro de FC ${row.punto_venta}-${row.numero_comprobante}`,
          },
        });
        chequeId = cheque.id;
      }

      // 5. Create Movimiento (INGRESO)
      const tipoComp = row.tipo_comprobante.replace(/_/g, ' ');
      const nroComp = `${String(row.punto_venta).padStart(4, '0')}-${row.numero_comprobante.padStart(8, '0')}`;
      const descripcion = `Cobro ${tipoComp} ${nroComp} - ${cliente?.razonSocial ?? ''}`;

      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'INGRESO',
          medioPago: data.medioPago,
          monto: data.monto,
          moneda: 'ARS',
          descripcion,
          comprobante: data.comprobanteCobro ?? null,
          fechaMovimiento: new Date(data.fechaCobro),
          cuentaId: data.cuentaId,
          clienteId: row.cliente_id,
          cuentaContableId: row.cuenta_contable_id,
          centroCostoId: row.centro_costo_id,
          estado: 'CONFIRMADO',
          registradoPorId: userId,
        },
      });

      // 6. Create CobroFactura
      const cobro = await tx.cobroFactura.create({
        data: {
          facturaId,
          monto: data.monto,
          fechaCobro: new Date(data.fechaCobro),
          medioPago: data.medioPago,
          movimientoId: movimiento.id,
          chequeId,
          comprobanteCobro: data.comprobanteCobro ?? null,
          observaciones: data.observaciones ?? null,
        },
      });

      // 7. Update factura (using round to avoid floating point drift)
      const nuevoMontoCobrado = parseFloat(row.monto_cobrado) + data.monto;
      const nuevoSaldoPendiente = parseFloat(row.total) - nuevoMontoCobrado;
      const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'COBRADA' : 'COBRO_PARCIAL';

      const facturaActualizada = await tx.facturaEmitida.update({
        where: { id: facturaId },
        data: {
          montoCobrado: Math.round(nuevoMontoCobrado * 100) / 100,
          saldoPendiente: Math.max(0, Math.round(nuevoSaldoPendiente * 100) / 100),
          estado: nuevoEstado,
        },
      });

      // 8. Update account balance (inside transaction for atomicity)
      await actualizarSaldoCuenta(data.cuentaId, tx);

      return { cobro, movimiento, factura: facturaActualizada, chequeId };
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    console.error('[Facturacion] registrarCobro error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Error) {
      if (error.message.startsWith('NOT_FOUND:')) {
        return res.status(404).json({ error: error.message.slice(10) });
      }
      if (error.message.startsWith('BAD_REQUEST:')) {
        return res.status(400).json({ error: error.message.slice(12) });
      }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un cheque con ese numero' });
    }
    res.status(500).json({ error: 'Error al registrar cobro' });
  }
};
