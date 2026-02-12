import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from '../finanzas/utils.js';

const createCargaSchema = z.object({
  monto: z.number().positive(),
  fecha: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  descripcion: z.string().optional(),
  comprobante: z.string().optional(),
});

export async function getCargas(req: Request, res: Response) {
  try {
    const tarjetaId = Number(req.params.tarjetaId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const [data, total] = await Promise.all([
      prisma.cargaTarjeta.findMany({
        where: { tarjetaId },
        include: {
          movimiento: { select: { id: true, codigo: true, estado: true } },
          registradoPor: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cargaTarjeta.count({ where: { tarjetaId } }),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Cargas] getCargas error:', error);
    res.status(500).json({ error: 'Error al obtener cargas' });
  }
}

export async function createCarga(req: Request, res: Response) {
  try {
    const tarjetaId = Number(req.params.tarjetaId);
    const data = createCargaSchema.parse(req.body);

    const tarjeta = await prisma.tarjetaPrecargable.findFirst({
      where: { id: tarjetaId, fechaEliminacion: null },
    });
    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });
    if (tarjeta.tipo !== 'PRECARGABLE')
      return res.status(400).json({ error: 'Solo tarjetas precargables pueden recibir cargas' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Movimiento INGRESO in the tarjeta's CuentaFinanciera
      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'INGRESO',
          medioPago: 'TRANSFERENCIA',
          monto: data.monto,
          descripcion:
            data.descripcion ||
            `Carga tarjeta ${tarjeta.alias || tarjeta.numeroTarjeta || '#' + tarjeta.id}`,
          fechaMovimiento: new Date(data.fecha),
          cuentaId: tarjeta.cuentaFinancieraId,
          empleadoId: tarjeta.empleadoId,
          estado: 'CONFIRMADO',
          registradoPorId: req.user!.id,
          comprobante: data.comprobante,
        },
      });

      // 2. Create CargaTarjeta
      const carga = await tx.cargaTarjeta.create({
        data: {
          tarjetaId,
          monto: data.monto,
          fecha: new Date(data.fecha),
          descripcion: data.descripcion,
          comprobante: data.comprobante,
          movimientoId: movimiento.id,
          registradoPorId: req.user!.id,
        },
        include: {
          movimiento: { select: { id: true, codigo: true, estado: true } },
        },
      });

      // 3. Recalculate balance
      await actualizarSaldoCuenta(tarjeta.cuentaFinancieraId, tx);

      return carga;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Cargas] createCarga error:', error);
    res.status(500).json({ error: 'Error al crear carga' });
  }
}
