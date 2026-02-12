import { Request, Response } from 'express';
import { z } from 'zod';
import { EstadoSeguroAP } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createSeguroAPSchema = z.object({
  empleadoId: z.number().int(),
  destino: z.string().max(200).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinalizacion: z.string().optional().nullable(),
});

const updateSeguroAPSchema = z.object({
  destino: z.string().max(200).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinalizacion: z.string().optional().nullable(),
});

const cambiarEstadoSchema = z.object({
  nuevoEstado: z.nativeEnum(EstadoSeguroAP),
  fechaEfectiva: z.string().optional(),
});

// Transiciones válidas
const TRANSICIONES: Record<EstadoSeguroAP, EstadoSeguroAP[]> = {
  PEDIDO_ALTA: ['ACTIVO'],
  ACTIVO: ['PEDIDO_BAJA'],
  PEDIDO_BAJA: ['BAJA'],
  BAJA: [],
};

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const estado = req.query.estado as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (estado) {
      whereClause.estado = estado as EstadoSeguroAP;
    }

    if (search) {
      whereClause.empleado = {
        fechaEliminacion: null,
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { legajo: { contains: search, mode: 'insensitive' } },
          { cuil: { contains: search, mode: 'insensitive' } },
        ],
      };
    } else {
      whereClause.empleado = { fechaEliminacion: null };
    }

    const [total, seguros] = await prisma.$transaction([
      prisma.seguroAP.count({ where: whereClause }),
      prisma.seguroAP.findMany({
        where: whereClause,
        include: {
          empleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              legajo: true,
              cuil: true,
              estado: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
      }),
    ]);

    res.json({
      data: seguros,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener seguros AP:', error);
    res.status(500).json({ error: 'Error al obtener seguros AP' });
  }
};

export const getByEmpleadoId = async (req: Request, res: Response) => {
  try {
    const empleadoId = Number(req.params.id);

    const seguros = await prisma.seguroAP.findMany({
      where: { empleadoId },
      orderBy: { fechaCreacion: 'desc' },
    });

    res.json(seguros);
  } catch (error) {
    console.error('Error al obtener seguros AP del empleado:', error);
    res.status(500).json({ error: 'Error al obtener seguros AP del empleado' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createSeguroAPSchema.parse(req.body);

    // Validar que el empleado existe y está activo
    const empleado = await prisma.empleado.findFirst({
      where: { id: body.empleadoId, fechaEliminacion: null },
    });
    if (!empleado) {
      return res.status(400).json({ error: 'El empleado no existe.' });
    }
    if (empleado.estado !== 'ACTIVO') {
      return res.status(400).json({ error: 'El empleado no está activo.' });
    }

    // Validar que no tenga un seguro activo o pendiente
    const seguroActivo = await prisma.seguroAP.findFirst({
      where: {
        empleadoId: body.empleadoId,
        estado: { in: ['ACTIVO', 'PEDIDO_ALTA'] },
      },
    });
    if (seguroActivo) {
      return res.status(400).json({
        error: 'El empleado ya tiene un seguro AP activo o pendiente de alta.',
      });
    }

    const seguro = await prisma.seguroAP.create({
      data: {
        empleadoId: body.empleadoId,
        destino: body.destino ?? null,
        observaciones: body.observaciones ?? null,
        fechaInicio: body.fechaInicio ? new Date(body.fechaInicio) : null,
        fechaFinalizacion: body.fechaFinalizacion ? new Date(body.fechaFinalizacion) : null,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, legajo: true },
        },
      },
    });

    res.status(201).json(seguro);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al crear seguro AP:', error);
    res.status(500).json({ error: 'Error al crear seguro AP' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.seguroId);
    const body = updateSeguroAPSchema.parse(req.body);

    const seguro = await prisma.seguroAP.findUnique({ where: { id } });
    if (!seguro) {
      return res.status(404).json({ error: 'Seguro AP no encontrado.' });
    }

    const updated = await prisma.seguroAP.update({
      where: { id },
      data: {
        destino: body.destino === undefined ? undefined : (body.destino ?? null),
        observaciones: body.observaciones === undefined ? undefined : (body.observaciones ?? null),
        fechaInicio:
          body.fechaInicio === undefined
            ? undefined
            : body.fechaInicio
              ? new Date(body.fechaInicio)
              : null,
        fechaFinalizacion:
          body.fechaFinalizacion === undefined
            ? undefined
            : body.fechaFinalizacion
              ? new Date(body.fechaFinalizacion)
              : null,
      },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, legajo: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al actualizar seguro AP:', error);
    res.status(500).json({ error: 'Error al actualizar seguro AP' });
  }
};

export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.seguroId);
    const body = cambiarEstadoSchema.parse(req.body);

    const seguro = await prisma.seguroAP.findUnique({ where: { id } });
    if (!seguro) {
      return res.status(404).json({ error: 'Seguro AP no encontrado.' });
    }

    // Validar transición
    const transicionesPermitidas = TRANSICIONES[seguro.estado];
    if (!transicionesPermitidas.includes(body.nuevoEstado)) {
      return res.status(400).json({
        error: `No se puede cambiar de ${seguro.estado} a ${body.nuevoEstado}.`,
      });
    }

    // Construir datos de actualización según la transición
    const updateData: Record<string, unknown> = { estado: body.nuevoEstado };

    if (body.nuevoEstado === 'ACTIVO') {
      updateData.fechaAltaEfectiva = body.fechaEfectiva
        ? new Date(body.fechaEfectiva as string)
        : new Date();
    } else if (body.nuevoEstado === 'PEDIDO_BAJA') {
      updateData.fechaSolicitudBaja = new Date();
    } else if (body.nuevoEstado === 'BAJA') {
      updateData.fechaBajaEfectiva = body.fechaEfectiva
        ? new Date(body.fechaEfectiva as string)
        : new Date();
    }

    const updated = await prisma.seguroAP.update({
      where: { id },
      data: updateData,
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, legajo: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al cambiar estado del seguro AP:', error);
    res.status(500).json({ error: 'Error al cambiar estado del seguro AP' });
  }
};

export const getResumen = async (_req: Request, res: Response) => {
  try {
    const empleadoNoEliminado = { empleado: { fechaEliminacion: null } };
    const [activos, pendientesAlta, pendientesBaja, totalEmpleadosActivos] =
      await prisma.$transaction([
        prisma.seguroAP.count({ where: { estado: 'ACTIVO', ...empleadoNoEliminado } }),
        prisma.seguroAP.count({ where: { estado: 'PEDIDO_ALTA', ...empleadoNoEliminado } }),
        prisma.seguroAP.count({ where: { estado: 'PEDIDO_BAJA', ...empleadoNoEliminado } }),
        prisma.empleado.count({
          where: { estado: 'ACTIVO', fechaEliminacion: null },
        }),
      ]);

    // Empleados activos sin cobertura (sin seguro ACTIVO ni PEDIDO_ALTA)
    const empleadosConCobertura = await prisma.seguroAP.findMany({
      where: { estado: { in: ['ACTIVO', 'PEDIDO_ALTA'] }, ...empleadoNoEliminado },
      select: { empleadoId: true },
      distinct: ['empleadoId'],
    });

    const sinCobertura = totalEmpleadosActivos - empleadosConCobertura.length;

    res.json({
      activos,
      pendientesAlta,
      pendientesBaja,
      sinCobertura: Math.max(0, sinCobertura),
      totalEmpleadosActivos,
    });
  } catch (error) {
    console.error('Error al obtener resumen de seguros AP:', error);
    res.status(500).json({ error: 'Error al obtener resumen de seguros AP' });
  }
};
