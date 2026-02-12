import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

interface RendicionWhereInput {
  estado?: string;
  tarjetaId?: number;
}

const createRendicionSchema = z.object({
  tarjetaId: z.number().int().positive(),
  fechaDesde: z.string(),
  fechaHasta: z.string(),
  observaciones: z.string().optional(),
});

export async function getRendiciones(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const estado = req.query.estado as string;
    const tarjetaId = req.query.tarjetaId ? Number(req.query.tarjetaId) : undefined;

    const where: RendicionWhereInput = {};
    if (estado) where.estado = estado;
    if (tarjetaId) where.tarjetaId = tarjetaId;

    const [data, total] = await Promise.all([
      prisma.rendicion.findMany({
        where,
        include: {
          tarjeta: {
            include: { empleado: { select: { id: true, nombre: true, apellido: true } } },
          },
          creadoPor: { select: { id: true, nombre: true, apellido: true } },
          aprobadoPor: { select: { id: true, nombre: true, apellido: true } },
          _count: { select: { gastos: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rendicion.count({ where }),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Rendiciones] getRendiciones error:', error);
    res.status(500).json({ error: 'Error al obtener rendiciones' });
  }
}

export async function createRendicion(req: Request, res: Response) {
  try {
    const data = createRendicionSchema.parse(req.body);

    const tarjeta = await prisma.tarjetaPrecargable.findFirst({
      where: { id: data.tarjetaId, fechaEliminacion: null },
    });
    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    // Check no open rendition for this card
    const openRendicion = await prisma.rendicion.findFirst({
      where: { tarjetaId: data.tarjetaId, estado: { in: ['ABIERTA', 'CERRADA'] } },
    });
    if (openRendicion)
      return res
        .status(400)
        .json({
          error: 'Ya existe una rendición abierta o pendiente de aprobación para esta tarjeta',
        });

    // Find gastos in date range not yet in a rendicion
    const gastosEnRango = await prisma.gastoTarjeta.findMany({
      where: {
        tarjetaId: data.tarjetaId,
        rendicionId: null,
        fecha: { gte: new Date(data.fechaDesde), lte: new Date(data.fechaHasta) },
        movimiento: { estado: { not: 'ANULADO' } },
      },
    });

    const totalGastos = gastosEnRango.reduce((acc, g) => acc + Number(g.monto), 0);

    // Generate codigo
    const count = await prisma.rendicion.count();
    const codigo = `REND-${String(count + 1).padStart(5, '0')}`;

    const rendicion = await prisma.$transaction(async (tx) => {
      const rend = await tx.rendicion.create({
        data: {
          codigo,
          tarjetaId: data.tarjetaId,
          fechaDesde: new Date(data.fechaDesde),
          fechaHasta: new Date(data.fechaHasta),
          totalGastos,
          cantidadGastos: gastosEnRango.length,
          observaciones: data.observaciones,
          creadoPorId: req.user!.id,
        },
      });

      // Assign gastos to this rendicion
      if (gastosEnRango.length > 0) {
        await tx.gastoTarjeta.updateMany({
          where: { id: { in: gastosEnRango.map((g) => g.id) } },
          data: { rendicionId: rend.id },
        });
      }

      return rend;
    });

    res.status(201).json(rendicion);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Rendiciones] createRendicion error:', error);
    res.status(500).json({ error: 'Error al crear rendición' });
  }
}

export async function cerrarRendicion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const rendicion = await prisma.rendicion.findUnique({ where: { id } });
    if (!rendicion) return res.status(404).json({ error: 'Rendición no encontrada' });
    if (rendicion.estado !== 'ABIERTA')
      return res.status(400).json({ error: 'Solo se pueden cerrar rendiciones abiertas' });

    const updated = await prisma.rendicion.update({
      where: { id },
      data: { estado: 'CERRADA' },
    });

    res.json(updated);
  } catch (error) {
    console.error('[Rendiciones] cerrarRendicion error:', error);
    res.status(500).json({ error: 'Error al cerrar rendición' });
  }
}

export async function aprobarRendicion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const rendicion = await prisma.rendicion.findUnique({ where: { id } });
    if (!rendicion) return res.status(404).json({ error: 'Rendición no encontrada' });
    if (rendicion.estado !== 'CERRADA')
      return res.status(400).json({ error: 'Solo se pueden aprobar rendiciones cerradas' });

    const updated = await prisma.rendicion.update({
      where: { id },
      data: { estado: 'APROBADA', aprobadoPorId: req.user!.id, fechaAprobacion: new Date() },
    });

    res.json(updated);
  } catch (error) {
    console.error('[Rendiciones] aprobarRendicion error:', error);
    res.status(500).json({ error: 'Error al aprobar rendición' });
  }
}

export async function rechazarRendicion(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { motivoRechazo } = z.object({ motivoRechazo: z.string().min(1) }).parse(req.body);

    const rendicion = await prisma.rendicion.findUnique({ where: { id } });
    if (!rendicion) return res.status(404).json({ error: 'Rendición no encontrada' });
    if (rendicion.estado !== 'CERRADA')
      return res.status(400).json({ error: 'Solo se pueden rechazar rendiciones cerradas' });

    const updated = await prisma.$transaction(async (tx) => {
      // Unlink gastos from rendicion
      await tx.gastoTarjeta.updateMany({
        where: { rendicionId: id },
        data: { rendicionId: null },
      });

      return tx.rendicion.update({
        where: { id },
        data: { estado: 'RECHAZADA', motivoRechazo },
      });
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Rendiciones] rechazarRendicion error:', error);
    res.status(500).json({ error: 'Error al rechazar rendición' });
  }
}
