import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createSedeSchema = z.object({
  clienteId: z.number().int(),
  zonaId: z.number().int(),
  nombre: z.string().min(3).max(100),
  direccion: z.string().min(5).max(255),
  telefono: z.string().optional().nullable(),
  contactoNombre: z.string().optional().nullable(),
  contactoTelefono: z.string().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
});

const updateSedeSchema = createSedeSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.SucursalWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } },
        { codigoExterno: { contains: search, mode: 'insensitive' } },
        { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, sedes] = await prisma.$transaction([
      prisma.sucursal.count({ where: whereClause }),
      prisma.sucursal.findMany({
        where: whereClause,
        include: {
          cliente: { select: { razonSocial: true } },
          zona: { select: { nombre: true } },
        },
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    res.json({
      data: sedes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener sedes:', error);
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createSedeSchema.parse(req.body);

    // Validar que el cliente exista y no esté borrado
    const cliente = await prisma.cliente.findFirst({
      where: { id: body.clienteId, fechaEliminacion: null },
    });
    if (!cliente)
      return res.status(400).json({ error: 'El cliente seleccionado no es válido o no existe.' });

    // Validar que la zona exista y no esté borrada
    const zona = await prisma.zona.findFirst({
      where: { id: body.zonaId, fechaEliminacion: null },
    });
    if (!zona)
      return res.status(400).json({ error: 'La zona seleccionada no es válida o no existe.' });

    const newSede = await prisma.sucursal.create({
      data: body,
      include: {
        cliente: { select: { razonSocial: true } },
        zona: { select: { nombre: true } },
      },
    });

    res.status(201).json(newSede);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear sede:', error);
    res
      .status(500)
      .json({ error: 'Error al crear sede. ' + (error instanceof Error ? error.message : '') });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateSedeSchema.parse(req.body);

    const sede = await prisma.sucursal.findUnique({ where: { id } });
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });

    const updated = await prisma.sucursal.update({
      where: { id },
      data: body,
      include: {
        cliente: { select: { razonSocial: true } },
        zona: { select: { nombre: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al actualizar sede:', error);
    res.status(500).json({ error: 'Error al actualizar sede' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Soft Delete
    await prisma.sucursal.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Sede eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sede:', error);
    res.status(500).json({ error: 'Error al eliminar sede' });
  }
};
