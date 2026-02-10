import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, TipoEmpleado, TipoContratacion } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createEmpleadoSchema = z.object({
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  email: z.string().email().optional().nullable(),
  direccion: z.string().max(255).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  inicioRelacionLaboral: z.string().datetime().or(z.date()),
  tipo: z.nativeEnum(TipoEmpleado),
  contratacion: z.nativeEnum(TipoContratacion).optional().nullable(),
  esReferente: z.boolean().optional().default(false),
  puesto: z.string().max(100).optional().nullable(),
  foto: z.string().max(500).optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
  fechaVencimientoSeguro: z.string().datetime().or(z.date()).optional().nullable(),
  fechaVencimientoRegistro: z.string().datetime().or(z.date()).optional().nullable(),
  zonaId: z.number().int().optional().nullable(),
  usuarioId: z.number().int().optional().nullable(),
});

const updateEmpleadoSchema = createEmpleadoSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.EmpleadoWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, empleados] = await prisma.$transaction([
      prisma.empleado.count({ where: whereClause }),
      prisma.empleado.findMany({
        where: whereClause,
        include: {
          zona: { select: { nombre: true } },
          usuario: { select: { email: true } },
        },
        skip,
        take: limit,
        orderBy: { apellido: 'asc' },
      }),
    ]);

    res.json({
      data: empleados,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
      include: {
        zona: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
      },
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createEmpleadoSchema.parse(req.body);

    // Validar email único si se proporciona
    if (body.email) {
      const existingEmail = await prisma.empleado.findFirst({
        where: { email: body.email, fechaEliminacion: null },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese email.' });
      }
    }

    // Validar zona si se proporciona
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona) {
        return res.status(400).json({ error: 'La zona seleccionada no existe.' });
      }
    }

    // Validar usuario si se proporciona
    if (body.usuarioId) {
      const usuario = await prisma.usuario.findFirst({
        where: { id: body.usuarioId, fechaEliminacion: null },
      });
      if (!usuario) {
        return res.status(400).json({ error: 'El usuario seleccionado no existe.' });
      }
      // Verificar que el usuario no esté ya asociado a otro empleado
      const existingEmpleado = await prisma.empleado.findFirst({
        where: { usuarioId: body.usuarioId, fechaEliminacion: null },
      });
      if (existingEmpleado) {
        return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado.' });
      }
    }

    const newEmpleado = await prisma.empleado.create({
      data: {
        ...body,
        inicioRelacionLaboral: new Date(body.inicioRelacionLaboral as string),
        fechaVencimientoSeguro: body.fechaVencimientoSeguro
          ? new Date(body.fechaVencimientoSeguro as string)
          : null,
        fechaVencimientoRegistro: body.fechaVencimientoRegistro
          ? new Date(body.fechaVencimientoRegistro as string)
          : null,
        zonaId: body.zonaId ?? null,
        usuarioId: body.usuarioId ?? null,
      },
      include: {
        zona: { select: { nombre: true } },
        usuario: { select: { email: true } },
      },
    });

    res.status(201).json(newEmpleado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateEmpleadoSchema.parse(req.body);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Validar email único si cambia
    if (body.email && body.email !== empleado.email) {
      const existingEmail = await prisma.empleado.findFirst({
        where: { email: body.email, fechaEliminacion: null },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe otro empleado con ese email.' });
      }
    }

    // Validar zona si cambia
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona) {
        return res.status(400).json({ error: 'La zona seleccionada no existe.' });
      }
    }

    // Validar usuario si cambia
    if (body.usuarioId && body.usuarioId !== empleado.usuarioId) {
      const usuario = await prisma.usuario.findFirst({
        where: { id: body.usuarioId, fechaEliminacion: null },
      });
      if (!usuario) {
        return res.status(400).json({ error: 'El usuario seleccionado no existe.' });
      }
      const existingEmpleado = await prisma.empleado.findFirst({
        where: { usuarioId: body.usuarioId, fechaEliminacion: null },
      });
      if (existingEmpleado) {
        return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado.' });
      }
    }

    const updated = await prisma.empleado.update({
      where: { id },
      data: {
        ...body,
        inicioRelacionLaboral: body.inicioRelacionLaboral
          ? new Date(body.inicioRelacionLaboral as string)
          : undefined,
        fechaVencimientoSeguro:
          body.fechaVencimientoSeguro === undefined
            ? undefined
            : body.fechaVencimientoSeguro
              ? new Date(body.fechaVencimientoSeguro as string)
              : null,
        fechaVencimientoRegistro:
          body.fechaVencimientoRegistro === undefined
            ? undefined
            : body.fechaVencimientoRegistro
              ? new Date(body.fechaVencimientoRegistro as string)
              : null,
        zonaId: body.zonaId === undefined ? undefined : (body.zonaId ?? null),
        usuarioId: body.usuarioId === undefined ? undefined : (body.usuarioId ?? null),
      },
      include: {
        zona: { select: { nombre: true } },
        usuario: { select: { email: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Soft Delete
    await prisma.empleado.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};
