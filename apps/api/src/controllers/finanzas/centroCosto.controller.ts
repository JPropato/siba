import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createCentroCostoSchema = z.object({
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(2).max(100),
  parentId: z.number().int().positive().optional().nullable(),
  descripcion: z.string().max(500).optional().nullable(),
});

// =====================================================
// CENTROS DE COSTO
// =====================================================

export const getCentrosCosto = async (req: Request, res: Response) => {
  try {
    const { activo } = req.query;

    const where: { activo?: boolean } = {};
    if (activo === 'false') where.activo = false;
    else where.activo = true; // By default only active

    const centros = await prisma.centroCosto.findMany({
      where,
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { codigo: 'asc' },
    });

    res.json(centros);
  } catch (error) {
    console.error('[Finanzas] getCentrosCosto error:', error);
    res.status(500).json({ error: 'Error al obtener centros de costo' });
  }
};

export const createCentroCosto = async (req: Request, res: Response) => {
  try {
    const data = createCentroCostoSchema.parse(req.body);

    // Validate parent exists
    if (data.parentId) {
      const parent = await prisma.centroCosto.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        return res.status(400).json({ error: 'Centro de costo padre no encontrado' });
      }
    }

    const centro = await prisma.centroCosto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        parentId: data.parentId ?? null,
        descripcion: data.descripcion ?? null,
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    res.status(201).json(centro);
  } catch (error) {
    console.error('[Finanzas] createCentroCosto error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un centro de costo con ese codigo' });
    }
    res.status(500).json({ error: 'Error al crear centro de costo' });
  }
};

export const updateCentroCosto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.centroCosto.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Centro de costo no encontrado' });
    }

    const data = createCentroCostoSchema.partial().parse(req.body);

    const centro = await prisma.centroCosto.update({
      where: { id },
      data: {
        ...(data.codigo !== undefined && { codigo: data.codigo }),
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    res.json(centro);
  } catch (error) {
    console.error('[Finanzas] updateCentroCosto error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar centro de costo' });
  }
};

export const deleteCentroCosto = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.centroCosto.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Centro de costo no encontrado' });
    }

    // Check for movimientos
    const movCount = await prisma.movimiento.count({ where: { centroCostoId: id } });
    if (movCount > 0) {
      return res
        .status(400)
        .json({ error: `No se puede desactivar: tiene ${movCount} movimientos asignados` });
    }

    // Check for active children
    const hijosActivos = await prisma.centroCosto.count({
      where: { parentId: id, activo: true },
    });
    if (hijosActivos > 0) {
      return res
        .status(400)
        .json({ error: `No se puede desactivar: tiene ${hijosActivos} centros hijos activos` });
    }

    // Soft delete
    const centro = await prisma.centroCosto.update({
      where: { id },
      data: { activo: false },
    });

    res.json(centro);
  } catch (error) {
    console.error('[Finanzas] deleteCentroCosto error:', error);
    res.status(500).json({ error: 'Error al desactivar centro de costo' });
  }
};
