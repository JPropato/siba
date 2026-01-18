import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../index.js';

// --- Schemas ---
const createVehiculoSchema = z.object({
  patente: z.string().min(6).max(10).toUpperCase(),
  marca: z.string().min(2).max(50).optional().nullable(),
  modelo: z.string().min(1).max(50).optional().nullable(),
  anio: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  tipo: z.string().optional().nullable(),
  zonaId: z.number().int().optional().nullable(),
  kilometros: z.number().int().min(0).optional().nullable(),
  estado: z.enum(['ACTIVO', 'TALLER', 'FUERA_SERVICIO']).default('ACTIVO'),
});

const updateVehiculoSchema = createVehiculoSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.VehiculoWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { patente: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
      ];

      if (!isNaN(Number(search))) {
        whereClause.OR.push({ codigoInterno: Number(search) });
      }
    }

    const [total, vehiculos] = await prisma.$transaction([
      prisma.vehiculo.count({ where: whereClause }),
      prisma.vehiculo.findMany({
        where: whereClause,
        include: {
          zona: { select: { nombre: true } },
        },
        skip,
        take: limit,
        orderBy: { patente: 'asc' },
      }),
    ]);

    res.json({
      data: vehiculos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createVehiculoSchema.parse(req.body);

    // Validar patente única
    const existing = await prisma.vehiculo.findFirst({
      where: { patente: body.patente, fechaEliminacion: null },
    });
    if (existing) return res.status(400).json({ error: 'Ya existe un vehículo con esa patente.' });

    // Validar zona si se proporciona
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona)
        return res.status(400).json({ error: 'La zona seleccionada no existe o no es válida.' });
    }

    const newVehiculo = await prisma.vehiculo.create({
      data: {
        ...body,
        zonaId: body.zonaId ?? null,
      },
      include: {
        zona: { select: { nombre: true } },
      },
    });

    res.status(201).json(newVehiculo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ error: 'Error al crear vehículo' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateVehiculoSchema.parse(req.body);

    const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    // Validar patente si cambia
    if (body.patente && body.patente !== vehiculo.patente) {
      const existing = await prisma.vehiculo.findFirst({
        where: { patente: body.patente, fechaEliminacion: null },
      });
      if (existing)
        return res.status(400).json({ error: 'Ya existe otro vehículo con esa patente.' });
    }

    // Validar zona si cambia
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona)
        return res.status(400).json({ error: 'La zona seleccionada no existe o no es válida.' });
    }

    const updated = await prisma.vehiculo.update({
      where: { id },
      data: {
        ...body,
        zonaId: body.zonaId === undefined ? undefined : (body.zonaId ?? null),
      },
      include: {
        zona: { select: { nombre: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Soft Delete
    await prisma.vehiculo.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
};
