import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createMaterialSchema = z.object({
  codigoArticulo: z.string().min(2).max(50),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().optional().nullable(),
  presentacion: z.string().min(1).max(100),
  unidadMedida: z.string().min(1).max(20),
  categoria: z.string().optional().nullable(),
  stockMinimo: z.number().min(0).optional().nullable(),
  // Pricing
  precioCosto: z.number().min(0).default(0),
  porcentajeRentabilidad: z.number().min(0).default(0),
  precioVenta: z.number().min(0).default(0),
});

const updateMaterialSchema = createMaterialSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const categoria = req.query.categoria as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.MaterialWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigoArticulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];

      if (!isNaN(Number(search))) {
        whereClause.OR.push({ codigoInterno: Number(search) });
      }
    }

    if (categoria) {
      whereClause.categoria = categoria;
    }

    const [total, materiales] = await prisma.$transaction([
      prisma.material.count({ where: whereClause }),
      prisma.material.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    res.json({
      data: materiales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createMaterialSchema.parse(req.body);

    // Validar código artículo único
    const existing = await prisma.material.findFirst({
      where: { codigoArticulo: body.codigoArticulo, fechaEliminacion: null },
    });
    if (existing)
      return res.status(400).json({ error: 'Ya existe un material con ese código de artículo.' });

    // Crear material y primer registro histórico
    const result = await prisma.$transaction(async (tx) => {
      const newMaterial = await tx.material.create({
        data: body,
      });

      // Crear registro histórico inicial
      await tx.historialPrecio.create({
        data: {
          materialId: newMaterial.id,
          precioCosto: body.precioCosto,
          precioVenta: body.precioVenta,
          porcentajeRentabilidad: body.porcentajeRentabilidad,
        },
      });

      return newMaterial;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al crear material:', error);
    res.status(500).json({ error: 'Error al crear material' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateMaterialSchema.parse(req.body);

    const currentMaterial = await prisma.material.findUnique({ where: { id } });
    if (!currentMaterial) return res.status(404).json({ error: 'Material no encontrado' });

    // Validar código si cambia
    if (body.codigoArticulo && body.codigoArticulo !== currentMaterial.codigoArticulo) {
      const existing = await prisma.material.findFirst({
        where: { codigoArticulo: body.codigoArticulo, fechaEliminacion: null },
      });
      if (existing)
        return res
          .status(400)
          .json({ error: 'Ya existe otro material con ese código de artículo.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Actualizar material
      const updated = await tx.material.update({
        where: { id },
        data: body,
      });

      // Verificar si hubo cambio de precios para guardar historial
      const precioCostoChanged =
        body.precioCosto !== undefined &&
        Number(body.precioCosto) !== Number(currentMaterial.precioCosto);
      const precioVentaChanged =
        body.precioVenta !== undefined &&
        Number(body.precioVenta) !== Number(currentMaterial.precioVenta);

      if (precioCostoChanged || precioVentaChanged) {
        await tx.historialPrecio.create({
          data: {
            materialId: id,
            precioCosto:
              body.precioCosto !== undefined
                ? body.precioCosto
                : Number(currentMaterial.precioCosto),
            precioVenta:
              body.precioVenta !== undefined
                ? body.precioVenta
                : Number(currentMaterial.precioVenta),
            porcentajeRentabilidad:
              body.porcentajeRentabilidad !== undefined
                ? body.porcentajeRentabilidad
                : Number(currentMaterial.porcentajeRentabilidad),
          },
        });
      }

      return updated;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al actualizar material:', error);
    res.status(500).json({ error: 'Error al actualizar material' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Soft Delete
    await prisma.material.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Material eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar material:', error);
    res.status(500).json({ error: 'Error al eliminar material' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const history = await prisma.historialPrecio.findMany({
      where: { materialId: id },
      orderBy: { fechaCambio: 'desc' },
    });
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
