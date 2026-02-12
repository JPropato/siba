import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createZonaSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(255).optional().nullable(),
});

const updateZonaSchema = createZonaSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ZonaWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
      // Intentar buscar por código si es un número
      if (!isNaN(Number(search))) {
        whereClause.OR.push({ codigo: Number(search) });
      }
    }

    const [total, zones] = await prisma.$transaction([
      prisma.zona.count({ where: whereClause }),
      prisma.zona.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    res.json({
      data: zones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ error: 'Error al obtener zonas' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const zone = await prisma.zona.findFirst({
      where: { id, fechaEliminacion: null },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Error al obtener zona:', error);
    res.status(500).json({ error: 'Error al obtener zona' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createZonaSchema.parse(req.body);

    // Verificar duplicado
    const existing = await prisma.zona.findUnique({
      where: { nombre: body.nombre },
    });

    if (existing) {
      if (existing.fechaEliminacion) {
        // Restaurar si estaba eliminada
        const restored = await prisma.zona.update({
          where: { id: existing.id },
          data: { ...body, fechaEliminacion: null },
        });
        return res.status(201).json(restored);
      }
      return res.status(400).json({ error: 'Ya existe una zona con ese nombre' });
    }

    const newZone = await prisma.zona.create({
      data: body,
    });

    res.status(201).json(newZone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al crear zona:', error);
    res
      .status(500)
      .json({ error: 'Error al crear zona. ' + (error instanceof Error ? error.message : '') });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateZonaSchema.parse(req.body);

    const zone = await prisma.zona.findUnique({ where: { id } });
    if (!zone) return res.status(404).json({ error: 'Zona no encontrada' });

    if (body.nombre && body.nombre !== zone.nombre) {
      const existing = await prisma.zona.findUnique({
        where: { nombre: body.nombre },
      });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe una zona con ese nombre' });
      }
    }

    const updated = await prisma.zona.update({
      where: { id },
      data: body,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al actualizar zona:', error);
    res.status(500).json({ error: 'Error al actualizar zona' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Validar si tiene sedes (sucursales) asociadas
    const hasSedes = await prisma.sucursal.findFirst({
      where: { zonaId: id, fechaEliminacion: null },
    });

    if (hasSedes) {
      return res.status(400).json({
        error:
          'No se puede eliminar la zona porque tiene sedes asociadas. Por favor, mueva o elimine las sedes primero.',
      });
    }

    // Validar si tiene vehículos asociados
    const hasVehiculos = await prisma.vehiculo.findFirst({
      where: { zonaId: id, fechaEliminacion: null },
    });

    if (hasVehiculos) {
      return res.status(400).json({
        error: 'No se puede eliminar la zona porque tiene vehículos asociados.',
      });
    }

    // Soft Delete
    await prisma.zona.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Zona eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar zona:', error);
    res.status(500).json({ error: 'Error al eliminar zona' });
  }
};
