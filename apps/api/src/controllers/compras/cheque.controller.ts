import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoCheque, EstadoCheque, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from '../finanzas/utils.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createChequeSchema = z.object({
  numero: z.string().min(1).max(30),
  tipo: z.nativeEnum(TipoCheque),
  bancoEmisor: z.string().min(1).max(100),
  fechaEmision: z.string().min(1),
  fechaCobro: z.string().min(1),
  monto: z.number().positive(),
  beneficiario: z.string().max(200).optional().nullable(),
  emisor: z.string().max(200).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

// =====================================================
// CHEQUES
// =====================================================

export const getCheques = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { tipo, estado, fechaCobroDesde, fechaCobroHasta, search } = req.query;

    const skip = (page - 1) * limit;

    const where: Prisma.ChequeWhereInput = {};

    if (tipo) where.tipo = tipo as TipoCheque;
    if (estado) where.estado = estado as EstadoCheque;
    if (fechaCobroDesde || fechaCobroHasta) {
      where.fechaCobro = {};
      if (fechaCobroDesde) where.fechaCobro.gte = new Date(fechaCobroDesde as string);
      if (fechaCobroHasta) where.fechaCobro.lte = new Date(fechaCobroHasta as string);
    }
    if (search) {
      where.OR = [
        { numero: { contains: search as string, mode: 'insensitive' } },
        { bancoEmisor: { contains: search as string, mode: 'insensitive' } },
        { emisor: { contains: search as string, mode: 'insensitive' } },
        { beneficiario: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [total, cheques] = await Promise.all([
      prisma.cheque.count({ where }),
      prisma.cheque.findMany({
        where,
        include: {
          cuentaDestino: { select: { id: true, nombre: true } },
        },
        skip,
        take: limit,
        orderBy: { fechaCobro: 'asc' },
      }),
    ]);

    res.json({
      data: cheques,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Compras] getCheques error:', error);
    res.status(500).json({ error: 'Error al obtener cheques' });
  }
};

export const getChequeById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }

    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: {
        cuentaDestino: { select: { id: true, nombre: true } },
        pagos: {
          include: {
            factura: {
              select: {
                id: true,
                tipoComprobante: true,
                puntoVenta: true,
                numeroComprobante: true,
                proveedor: { select: { razonSocial: true } },
              },
            },
          },
        },
      },
    });

    if (!cheque) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    res.json(cheque);
  } catch (error) {
    console.error('[Compras] getChequeById error:', error);
    res.status(500).json({ error: 'Error al obtener cheque' });
  }
};

export const createCheque = async (req: Request, res: Response) => {
  try {
    const data = createChequeSchema.parse(req.body);

    const cheque = await prisma.cheque.create({
      data: {
        numero: data.numero,
        tipo: data.tipo,
        bancoEmisor: data.bancoEmisor,
        fechaEmision: new Date(data.fechaEmision),
        fechaCobro: new Date(data.fechaCobro),
        monto: data.monto,
        beneficiario: data.beneficiario ?? null,
        emisor: data.emisor ?? null,
        observaciones: data.observaciones ?? null,
      },
    });

    res.status(201).json(cheque);
  } catch (error) {
    console.error('[Compras] createCheque error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un cheque con ese numero' });
    }
    res.status(500).json({ error: 'Error al crear cheque' });
  }
};

export const updateCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.cheque.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    const updateSchema = z.object({
      beneficiario: z.string().max(200).optional().nullable(),
      emisor: z.string().max(200).optional().nullable(),
      observaciones: z.string().max(2000).optional().nullable(),
    });

    const data = updateSchema.parse(req.body);

    const cheque = await prisma.cheque.update({
      where: { id },
      data: {
        ...(data.beneficiario !== undefined && { beneficiario: data.beneficiario ?? null }),
        ...(data.emisor !== undefined && { emisor: data.emisor ?? null }),
        ...(data.observaciones !== undefined && { observaciones: data.observaciones ?? null }),
      },
    });

    res.json(cheque);
  } catch (error) {
    console.error('[Compras] updateCheque error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar cheque' });
  }
};

export const depositarCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }
    const { cuentaDestinoId } = z
      .object({ cuentaDestinoId: z.number().int().positive() })
      .parse(req.body);

    const cheque = await prisma.$transaction(async (tx) => {
      const existing = await tx.cheque.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('NOT_FOUND:Cheque no encontrado');
      }

      if (existing.estado !== 'CARTERA') {
        throw new Error(`BAD_REQUEST:No se puede depositar un cheque en estado ${existing.estado}`);
      }

      const cuenta = await tx.cuentaFinanciera.findUnique({ where: { id: cuentaDestinoId } });
      if (!cuenta || !cuenta.activa) {
        throw new Error('BAD_REQUEST:Cuenta destino no encontrada o inactiva');
      }

      return tx.cheque.update({
        where: { id },
        data: {
          estado: 'DEPOSITADO',
          cuentaDestinoId,
          fechaDeposito: new Date(),
        },
      });
    });

    res.json(cheque);
  } catch (error) {
    console.error('[Compras] depositarCheque error:', error);
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
    res.status(500).json({ error: 'Error al depositar cheque' });
  }
};

export const cobrarCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }
    const userId = (req as Request & { user: { id: number } }).user.id;

    const existing = await prisma.cheque.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    if (existing.estado !== 'DEPOSITADO') {
      return res
        .status(400)
        .json({ error: `No se puede cobrar un cheque en estado ${existing.estado}` });
    }

    if (!existing.cuentaDestinoId) {
      return res.status(400).json({ error: 'El cheque no tiene cuenta destino asignada' });
    }

    const cuentaDestinoId = existing.cuentaDestinoId;

    const result = await prisma.$transaction(async (tx) => {
      // Create INGRESO movement
      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'INGRESO',
          medioPago: existing.tipo === 'ECHEQ' ? 'ECHEQ' : 'CHEQUE',
          monto: existing.monto,
          moneda: 'ARS',
          descripcion: `Cobro cheque ${existing.numero} - ${existing.bancoEmisor}`,
          fechaMovimiento: new Date(),
          cuentaId: cuentaDestinoId,
          estado: 'CONFIRMADO',
          registradoPorId: userId,
        },
      });

      const cheque = await tx.cheque.update({
        where: { id },
        data: {
          estado: 'COBRADO',
          fechaAcreditacion: new Date(),
        },
      });

      // Update account balance (inside transaction for atomicity)
      await actualizarSaldoCuenta(cuentaDestinoId, tx);

      return { cheque, movimiento };
    });

    res.json(result);
  } catch (error) {
    console.error('[Compras] cobrarCheque error:', error);
    res.status(500).json({ error: 'Error al cobrar cheque' });
  }
};

export const endosarCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }
    const { endosadoA } = z.object({ endosadoA: z.string().min(1).max(200) }).parse(req.body);

    const existing = await prisma.cheque.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    if (existing.estado !== 'CARTERA') {
      return res
        .status(400)
        .json({ error: `No se puede endosar un cheque en estado ${existing.estado}` });
    }

    const cheque = await prisma.cheque.update({
      where: { id },
      data: {
        estado: 'ENDOSADO',
        endosadoA,
        fechaEndoso: new Date(),
      },
    });

    res.json(cheque);
  } catch (error) {
    console.error('[Compras] endosarCheque error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al endosar cheque' });
  }
};

export const rechazarCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }
    const { motivoRechazo } = z
      .object({ motivoRechazo: z.string().min(1).max(500) })
      .parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.cheque.findUnique({ where: { id } });
      if (!existing) {
        throw new Error('NOT_FOUND:Cheque no encontrado');
      }

      if (existing.estado !== 'CARTERA' && existing.estado !== 'DEPOSITADO') {
        throw new Error(`BAD_REQUEST:No se puede rechazar un cheque en estado ${existing.estado}`);
      }

      // Reverse associated PagoFactura if cheque was used to pay a supplier invoice
      const pagosAsociados = await tx.pagoFactura.findMany({
        where: { chequeId: id },
        include: { factura: true },
      });

      for (const pago of pagosAsociados) {
        // Anular the associated movimiento
        if (pago.movimientoId) {
          await tx.movimiento.update({
            where: { id: pago.movimientoId },
            data: { estado: 'ANULADO' },
          });
        }

        // Reverse the factura amounts
        const factura = pago.factura;
        const nuevoMontoPagado = Math.max(0, Number(factura.montoPagado) - Number(pago.monto));
        const nuevoSaldoPendiente = Number(factura.totalAPagar) - nuevoMontoPagado;
        const nuevoEstado = nuevoMontoPagado <= 0.01 ? 'PENDIENTE' : 'PAGO_PARCIAL';

        await tx.facturaProveedor.update({
          where: { id: factura.id },
          data: {
            montoPagado: Math.round(nuevoMontoPagado * 100) / 100,
            saldoPendiente: Math.round(nuevoSaldoPendiente * 100) / 100,
            estado: nuevoEstado,
          },
        });
      }

      // Reverse associated CobroFactura if cheque was received from a client
      const cobrosAsociados = await tx.cobroFactura.findMany({
        where: { chequeId: id },
        include: { factura: true },
      });

      for (const cobro of cobrosAsociados) {
        if (cobro.movimientoId) {
          await tx.movimiento.update({
            where: { id: cobro.movimientoId },
            data: { estado: 'ANULADO' },
          });
        }

        const factura = cobro.factura;
        const nuevoMontoCobrado = Math.max(0, Number(factura.montoCobrado) - Number(cobro.monto));
        const nuevoSaldoPendiente = Number(factura.total) - nuevoMontoCobrado;
        const nuevoEstado = nuevoMontoCobrado <= 0.01 ? 'PENDIENTE' : 'COBRO_PARCIAL';

        await tx.facturaEmitida.update({
          where: { id: factura.id },
          data: {
            montoCobrado: Math.round(nuevoMontoCobrado * 100) / 100,
            saldoPendiente: Math.round(nuevoSaldoPendiente * 100) / 100,
            estado: nuevoEstado,
          },
        });
      }

      const cheque = await tx.cheque.update({
        where: { id },
        data: {
          estado: 'RECHAZADO',
          motivoRechazo,
        },
      });

      // Update affected account balances
      const affectedCuentaIds = new Set<number>();
      for (const pago of pagosAsociados) {
        if (pago.movimientoId) {
          const mov = await tx.movimiento.findUnique({
            where: { id: pago.movimientoId },
            select: { cuentaId: true },
          });
          if (mov) affectedCuentaIds.add(mov.cuentaId);
        }
      }
      for (const cobro of cobrosAsociados) {
        if (cobro.movimientoId) {
          const mov = await tx.movimiento.findUnique({
            where: { id: cobro.movimientoId },
            select: { cuentaId: true },
          });
          if (mov) affectedCuentaIds.add(mov.cuentaId);
        }
      }
      for (const cuentaId of affectedCuentaIds) {
        await actualizarSaldoCuenta(cuentaId, tx);
      }

      return {
        cheque,
        reversedPagos: pagosAsociados.length,
        reversedCobros: cobrosAsociados.length,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('[Compras] rechazarCheque error:', error);
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
    res.status(500).json({ error: 'Error al rechazar cheque' });
  }
};

export const anularCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }

    const existing = await prisma.cheque.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    if (existing.estado !== 'CARTERA') {
      return res.status(400).json({ error: `Solo se pueden anular cheques en estado CARTERA` });
    }

    const cheque = await prisma.cheque.update({
      where: { id },
      data: { estado: 'ANULADO' },
    });

    res.json(cheque);
  } catch (error) {
    console.error('[Compras] anularCheque error:', error);
    res.status(500).json({ error: 'Error al anular cheque' });
  }
};

// =====================================================
// VENTA DE CHEQUES (flujo 2 pasos: vender → acreditar)
// =====================================================

// Utilidad: calcular comision por cheque
function calcularComisionCheque(monto: number, tasaDescuento: number, ivaComision: number) {
  const comisionBruta = Math.round(monto * tasaDescuento * 100) / 100;
  const ivaDeComision = Math.round(comisionBruta * ivaComision * 100) / 100;
  const montoNeto = Math.round((monto - comisionBruta - ivaDeComision) * 100) / 100;
  return { comisionBruta, ivaDeComision, montoNeto };
}

const venderSchema = z.object({
  entidadCompradora: z.string().min(1).max(200),
  tasaDescuento: z.number().min(0).max(1),
  ivaComision: z.number().min(0).max(1),
});

// Paso 1: Vender cheque individual (NO crea movimiento)
export const venderCheque = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de cheque invalido' });
    }

    const data = venderSchema.parse(req.body);

    const existing = await prisma.cheque.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cheque no encontrado' });
    }

    if (existing.estado !== 'CARTERA') {
      return res.status(400).json({ error: `Solo se pueden vender cheques en estado CARTERA` });
    }

    const monto = Number(existing.monto);
    const { comisionBruta, montoNeto } = calcularComisionCheque(
      monto,
      data.tasaDescuento,
      data.ivaComision
    );
    const loteId = crypto.randomUUID();

    const cheque = await prisma.cheque.update({
      where: { id },
      data: {
        estado: 'VENDIDO',
        endosadoA: data.entidadCompradora,
        ventaLoteId: loteId,
        ventaEntidad: data.entidadCompradora,
        ventaTasaDescuento: data.tasaDescuento,
        ventaIvaComision: data.ivaComision,
        ventaComisionBruta: comisionBruta,
        ventaMontoNeto: montoNeto,
      },
    });

    res.json({ cheque, loteId, montoNeto });
  } catch (error) {
    console.error('[Compras] venderCheque error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al vender cheque' });
  }
};

// Paso 1 (batch): Vender lote de cheques (NO crea movimiento)
export const venderBatchCheques = async (req: Request, res: Response) => {
  try {
    const venderBatchSchema = z.object({
      chequeIds: z.array(z.number().int().positive()).min(1).max(100),
      entidadCompradora: z.string().min(1).max(200),
      tasaDescuento: z.number().min(0).max(1),
      ivaComision: z.number().min(0).max(1),
    });

    const data = venderBatchSchema.parse(req.body);

    // Pre-validate all cheques
    const cheques = await prisma.cheque.findMany({
      where: { id: { in: data.chequeIds } },
    });

    const errors: string[] = [];
    const notFound = data.chequeIds.filter((id) => !cheques.find((c) => c.id === id));
    if (notFound.length > 0) {
      errors.push(`Cheques no encontrados: IDs ${notFound.join(', ')}`);
    }
    const notCartera = cheques.filter((c) => c.estado !== 'CARTERA');
    if (notCartera.length > 0) {
      errors.push(`Cheques que no estan en CARTERA: ${notCartera.map((c) => c.numero).join(', ')}`);
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }

    const loteId = crypto.randomUUID();
    let totalBruto = 0;
    let totalComision = 0;
    let totalIva = 0;
    let totalNeto = 0;

    // Calculate per-cheque
    const updates = cheques.map((cheque) => {
      const monto = Number(cheque.monto);
      const { comisionBruta, ivaDeComision, montoNeto } = calcularComisionCheque(
        monto,
        data.tasaDescuento,
        data.ivaComision
      );
      totalBruto += monto;
      totalComision += comisionBruta;
      totalIva += ivaDeComision;
      totalNeto += montoNeto;
      return { id: cheque.id, comisionBruta, montoNeto };
    });

    totalBruto = Math.round(totalBruto * 100) / 100;
    totalComision = Math.round(totalComision * 100) / 100;
    totalIva = Math.round(totalIva * 100) / 100;
    totalNeto = Math.round(totalNeto * 100) / 100;

    // Execute all updates in transaction
    await prisma.$transaction(async (tx) => {
      for (const upd of updates) {
        await tx.cheque.update({
          where: { id: upd.id },
          data: {
            estado: 'VENDIDO',
            endosadoA: data.entidadCompradora,
            ventaLoteId: loteId,
            ventaEntidad: data.entidadCompradora,
            ventaTasaDescuento: data.tasaDescuento,
            ventaIvaComision: data.ivaComision,
            ventaComisionBruta: upd.comisionBruta,
            ventaMontoNeto: upd.montoNeto,
          },
        });
      }
    });

    res.json({
      loteId,
      chequesVendidos: cheques.length,
      totalBruto,
      totalComision,
      totalIva,
      totalNeto,
    });
  } catch (error) {
    console.error('[Compras] venderBatchCheques error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al vender cheques en lote' });
  }
};

// Paso 2: Acreditar venta (crea movimiento INGRESO por neto total)
export const acreditarVentaCheques = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;

    const acreditarVentaSchema = z.object({
      chequeIds: z.array(z.number().int().positive()).min(1),
      cuentaDestinoId: z.number().int().positive(),
    });

    const data = acreditarVentaSchema.parse(req.body);

    // Validate all cheques
    const cheques = await prisma.cheque.findMany({
      where: { id: { in: data.chequeIds } },
    });

    const errors: string[] = [];
    const notFound = data.chequeIds.filter((id) => !cheques.find((c) => c.id === id));
    if (notFound.length > 0) {
      errors.push(`Cheques no encontrados: IDs ${notFound.join(', ')}`);
    }
    const notVendido = cheques.filter((c) => c.estado !== 'VENDIDO');
    if (notVendido.length > 0) {
      errors.push(
        `Cheques que no estan en estado VENDIDO: ${notVendido.map((c) => c.numero).join(', ')}`
      );
    }
    const yaAcreditados = cheques.filter((c) => c.ventaMovimientoId !== null);
    if (yaAcreditados.length > 0) {
      errors.push(`Cheques ya acreditados: ${yaAcreditados.map((c) => c.numero).join(', ')}`);
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. ') });
    }

    // Validate destination account
    const cuenta = await prisma.cuentaFinanciera.findUnique({
      where: { id: data.cuentaDestinoId },
    });
    if (!cuenta || !cuenta.activa) {
      return res.status(400).json({ error: 'Cuenta destino no encontrada o inactiva' });
    }

    // Calculate total neto
    const totalNeto =
      Math.round(cheques.reduce((sum, c) => sum + Number(c.ventaMontoNeto ?? c.monto), 0) * 100) /
      100;

    const entidad = cheques[0].ventaEntidad ?? cheques[0].endosadoA ?? 'N/A';
    const chequesDesc =
      cheques.length === 1 ? `cheque ${cheques[0].numero}` : `lote ${cheques.length} cheques`;

    const result = await prisma.$transaction(async (tx) => {
      // Create ONE INGRESO movement for total neto
      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'INGRESO',
          medioPago: 'CHEQUE',
          monto: totalNeto,
          moneda: 'ARS',
          descripcion: `Acreditacion venta ${chequesDesc} - ${entidad}`,
          fechaMovimiento: new Date(),
          cuentaId: data.cuentaDestinoId,
          estado: 'CONFIRMADO',
          registradoPorId: userId,
        },
      });

      // Update each cheque with movement reference
      for (const cheque of cheques) {
        await tx.cheque.update({
          where: { id: cheque.id },
          data: {
            ventaMovimientoId: movimiento.id,
            cuentaDestinoId: data.cuentaDestinoId,
            fechaAcreditacion: new Date(),
          },
        });
      }

      // Update account balance
      await actualizarSaldoCuenta(data.cuentaDestinoId, tx);

      return { movimiento, chequesAcreditados: cheques.length, totalNeto };
    });

    res.json(result);
  } catch (error) {
    console.error('[Compras] acreditarVentaCheques error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al acreditar venta de cheques' });
  }
};
