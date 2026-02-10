import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from './utils.js';

const createTransferenciaSchema = z.object({
  cuentaOrigenId: z.number().int().positive(),
  cuentaDestinoId: z.number().int().positive(),
  monto: z.number().positive(),
  descripcion: z.string().min(3).max(500),
  fechaMovimiento: z.string().datetime(),
  comprobante: z.string().max(100).optional().nullable(),
});

export const createTransferencia = async (req: Request, res: Response) => {
  try {
    const data = createTransferenciaSchema.parse(req.body);
    const userId = req.user?.id || 1;

    if (data.cuentaOrigenId === data.cuentaDestinoId) {
      return res.status(400).json({ error: 'La cuenta origen y destino no pueden ser la misma' });
    }

    // Verificar que ambas cuentas existan y estén activas
    const [cuentaOrigen, cuentaDestino] = await Promise.all([
      prisma.cuentaFinanciera.findUnique({ where: { id: data.cuentaOrigenId } }),
      prisma.cuentaFinanciera.findUnique({ where: { id: data.cuentaDestinoId } }),
    ]);

    if (!cuentaOrigen || !cuentaOrigen.activa) {
      return res.status(400).json({ error: 'La cuenta origen no existe o no está activa' });
    }
    if (!cuentaDestino || !cuentaDestino.activa) {
      return res.status(400).json({ error: 'La cuenta destino no existe o no está activa' });
    }

    const transferenciaRef = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fechaMovimiento = new Date(data.fechaMovimiento);

    const [egreso, ingreso] = await prisma.$transaction(async (tx) => {
      // Crear EGRESO en cuenta origen
      const egreso = await tx.movimiento.create({
        data: {
          tipo: 'EGRESO',
          categoriaEgreso: 'TRANSFERENCIA_SALIDA',
          medioPago: 'TRANSFERENCIA',
          monto: data.monto,
          descripcion: `${data.descripcion} → ${cuentaDestino.nombre}`,
          comprobante: data.comprobante || null,
          fechaMovimiento,
          cuentaId: data.cuentaOrigenId,
          registradoPorId: userId,
          transferenciaRef,
        },
        include: {
          cuenta: { select: { id: true, nombre: true } },
        },
      });

      // Crear INGRESO en cuenta destino
      const ingreso = await tx.movimiento.create({
        data: {
          tipo: 'INGRESO',
          categoriaIngreso: 'TRANSFERENCIA_ENTRADA',
          medioPago: 'TRANSFERENCIA',
          monto: data.monto,
          descripcion: `${data.descripcion} ← ${cuentaOrigen.nombre}`,
          comprobante: data.comprobante || null,
          fechaMovimiento,
          cuentaId: data.cuentaDestinoId,
          registradoPorId: userId,
          transferenciaRef,
        },
        include: {
          cuenta: { select: { id: true, nombre: true } },
        },
      });

      return [egreso, ingreso];
    });

    // Actualizar saldos de ambas cuentas
    await Promise.all([
      actualizarSaldoCuenta(data.cuentaOrigenId),
      actualizarSaldoCuenta(data.cuentaDestinoId),
    ]);

    res.status(201).json({ egreso, ingreso, transferenciaRef });
  } catch (error) {
    console.error('[Finanzas] createTransferencia error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear la transferencia' });
  }
};
