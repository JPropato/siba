import { Request, Response } from 'express';
import { z } from 'zod';
import { MedioPago, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from '../finanzas/utils.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const registrarPagoSchema = z.object({
  monto: z.number().positive(),
  fechaPago: z.string().min(1),
  medioPago: z.nativeEnum(MedioPago),
  cuentaId: z.number().int().positive(),
  chequeId: z.number().int().positive().optional().nullable(),
  comprobantePago: z.string().max(100).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
});

// =====================================================
// PAGOS DE FACTURA
// =====================================================

export const registrarPago = async (req: Request, res: Response) => {
  try {
    const facturaId = Number(req.params.id);
    if (isNaN(facturaId)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }
    const data = registrarPagoSchema.parse(req.body);
    const userId = (req as Request & { user: { id: number } }).user.id;

    // Validate: if paying with CHEQUE/ECHEQ, chequeId is required
    if ((data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ') && !data.chequeId) {
      return res.status(400).json({
        error: 'Debe seleccionar un cheque al pagar con cheque',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate factura
      const factura = await tx.facturaProveedor.findUnique({
        where: { id: facturaId },
        include: { proveedor: { select: { razonSocial: true } } },
      });

      if (!factura) {
        throw new Error('NOT_FOUND:Factura no encontrada');
      }

      if (factura.estado === 'ANULADA') {
        throw new Error('BAD_REQUEST:No se puede pagar una factura anulada');
      }

      if (factura.estado === 'PAGADA') {
        throw new Error('BAD_REQUEST:La factura ya esta completamente pagada');
      }

      // 2. Validate amount
      const saldoPendiente = Number(factura.saldoPendiente);
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

      // 3b. Validate cheque if paying with CHEQUE/ECHEQ
      if (data.chequeId && (data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ')) {
        const cheque = await tx.cheque.findUnique({ where: { id: data.chequeId } });
        if (!cheque) {
          throw new Error('BAD_REQUEST:Cheque no encontrado');
        }
        if (cheque.estado !== 'CARTERA') {
          throw new Error(
            `BAD_REQUEST:El cheque debe estar en CARTERA para usar como pago (estado actual: ${cheque.estado})`
          );
        }
      }

      // 4. Create Movimiento (EGRESO)
      const tipoComp = factura.tipoComprobante.replace(/_/g, ' ');
      const nroComp = `${String(factura.puntoVenta).padStart(4, '0')}-${factura.numeroComprobante.padStart(8, '0')}`;
      const descripcion = `Pago ${tipoComp} ${nroComp} - ${factura.proveedor.razonSocial}`;

      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'EGRESO',
          medioPago: data.medioPago,
          monto: data.monto,
          moneda: 'ARS',
          descripcion,
          comprobante: data.comprobantePago ?? null,
          fechaMovimiento: new Date(data.fechaPago),
          cuentaId: data.cuentaId,
          cuentaContableId: factura.cuentaContableId,
          centroCostoId: factura.centroCostoId,
          estado: 'CONFIRMADO',
          registradoPorId: userId,
        },
      });

      // 5. Create PagoFactura
      const pago = await tx.pagoFactura.create({
        data: {
          facturaId,
          monto: data.monto,
          fechaPago: new Date(data.fechaPago),
          medioPago: data.medioPago,
          movimientoId: movimiento.id,
          chequeId: data.chequeId ?? null,
          comprobantePago: data.comprobantePago ?? null,
          observaciones: data.observaciones ?? null,
        },
      });

      // 6. Auto-endoso: if paying with cheque, transition to ENDOSADO
      if (data.chequeId && (data.medioPago === 'CHEQUE' || data.medioPago === 'ECHEQ')) {
        await tx.cheque.update({
          where: { id: data.chequeId },
          data: {
            estado: 'ENDOSADO',
            endosadoA: factura.proveedor.razonSocial,
            fechaEndoso: new Date(),
          },
        });
      }

      // 7. Update factura (using round to avoid floating point drift)
      const nuevoMontoPagado = Number(factura.montoPagado) + data.monto;
      const nuevoSaldoPendiente = Number(factura.totalAPagar) - nuevoMontoPagado;
      const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'PAGADA' : 'PAGO_PARCIAL';

      const facturaActualizada = await tx.facturaProveedor.update({
        where: { id: facturaId },
        data: {
          montoPagado: Math.round(nuevoMontoPagado * 100) / 100,
          saldoPendiente: Math.max(0, Math.round(nuevoSaldoPendiente * 100) / 100),
          estado: nuevoEstado,
        },
      });

      // 8. Update account balance (inside transaction for atomicity)
      await actualizarSaldoCuenta(data.cuentaId, tx);

      return { pago, movimiento, factura: facturaActualizada };
    });

    res.status(201).json(result);
  } catch (error: unknown) {
    console.error('[Compras] registrarPago error:', error);
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
      return res.status(400).json({ error: 'Error de constraint unica al registrar pago' });
    }
    res.status(500).json({ error: 'Error al registrar pago' });
  }
};
