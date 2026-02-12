import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoMultaVehiculo, EstadoMultaVehiculo } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createMultaSchema = z.object({
  vehiculoId: z.number().int(),
  tipo: z.nativeEnum(TipoMultaVehiculo),
  fecha: z.string(),
  monto: z.number().positive(),
  numeroActa: z.string().max(100).optional().nullable(),
  descripcion: z.string().max(2000).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

const updateMultaSchema = z.object({
  tipo: z.nativeEnum(TipoMultaVehiculo).optional(),
  estado: z.nativeEnum(EstadoMultaVehiculo).optional(),
  fecha: z.string().optional(),
  monto: z.number().positive().optional(),
  numeroActa: z.string().max(100).optional().nullable(),
  descripcion: z.string().max(2000).optional().nullable(),
  fechaPago: z.string().optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const tipo = req.query.tipo as string;
    const estado = req.query.estado as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      vehiculo: { fechaEliminacion: null },
    };

    if (tipo) {
      whereClause.tipo = tipo as TipoMultaVehiculo;
    }

    if (estado) {
      whereClause.estado = estado as EstadoMultaVehiculo;
    }

    if (search) {
      whereClause.vehiculo = {
        fechaEliminacion: null,
        OR: [
          { patente: { contains: search, mode: 'insensitive' } },
          { marca: { contains: search, mode: 'insensitive' } },
          { modelo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, multas] = await prisma.$transaction([
      prisma.multaVehiculo.count({ where: whereClause }),
      prisma.multaVehiculo.findMany({
        where: whereClause,
        include: {
          vehiculo: {
            select: {
              id: true,
              patente: true,
              marca: true,
              modelo: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
      }),
    ]);

    res.json({
      data: multas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener multas de vehículos:', error);
    res.status(500).json({ error: 'Error al obtener multas de vehículos' });
  }
};

export const getByVehiculoId = async (req: Request, res: Response) => {
  try {
    const vehiculoId = Number(req.params.id);

    const multas = await prisma.multaVehiculo.findMany({
      where: { vehiculoId },
      orderBy: { fecha: 'desc' },
    });

    res.json(multas);
  } catch (error) {
    console.error('Error al obtener multas del vehículo:', error);
    res.status(500).json({ error: 'Error al obtener multas del vehículo' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    // Si viene vehiculoId en params (ruta /:id/multas), usarlo
    const vehiculoId = req.params.id ? Number(req.params.id) : req.body.vehiculoId;

    const body = createMultaSchema.parse({
      ...req.body,
      vehiculoId,
    });

    // Validar que el vehiculo existe y no esta eliminado
    const vehiculo = await prisma.vehiculo.findFirst({
      where: { id: body.vehiculoId, fechaEliminacion: null },
    });
    if (!vehiculo) {
      return res.status(400).json({ error: 'El vehículo no existe.' });
    }

    const multa = await prisma.multaVehiculo.create({
      data: {
        vehiculoId: body.vehiculoId,
        tipo: body.tipo,
        fecha: new Date(body.fecha),
        monto: body.monto,
        numeroActa: body.numeroActa ?? null,
        descripcion: body.descripcion ?? null,
        observaciones: body.observaciones ?? null,
      },
      include: {
        vehiculo: {
          select: {
            id: true,
            patente: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    res.status(201).json(multa);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al crear multa de vehículo:', error);
    res.status(500).json({ error: 'Error al crear multa de vehículo' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.multaId);
    const body = updateMultaSchema.parse(req.body);

    const multa = await prisma.multaVehiculo.findUnique({ where: { id } });
    if (!multa) {
      return res.status(404).json({ error: 'Multa no encontrada.' });
    }

    // Si el estado cambia a PAGADA y no hay fechaPago, setear hoy
    const updateData: Record<string, unknown> = { ...body };

    if (body.fecha !== undefined) {
      updateData.fecha = new Date(body.fecha);
    }

    if (body.fechaPago !== undefined) {
      updateData.fechaPago = body.fechaPago ? new Date(body.fechaPago) : null;
    } else if (body.estado === 'PAGADA' && !multa.fechaPago) {
      updateData.fechaPago = new Date();
    }

    // Limpiar campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updated = await prisma.multaVehiculo.update({
      where: { id },
      data: updateData,
      include: {
        vehiculo: {
          select: {
            id: true,
            patente: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al actualizar multa de vehículo:', error);
    res.status(500).json({ error: 'Error al actualizar multa de vehículo' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.multaId);

    // Hard delete (las multas no necesitan soft delete)
    await prisma.multaVehiculo.delete({
      where: { id },
    });

    res.json({ message: 'Multa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar multa de vehículo:', error);
    res.status(500).json({ error: 'Error al eliminar multa de vehículo' });
  }
};
