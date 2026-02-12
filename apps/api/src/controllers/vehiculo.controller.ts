import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

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
  fechaVencimientoVTV: z.string().datetime().or(z.date()).optional().nullable(),
  fechaCambioAceite: z.string().optional().nullable(),
  proximosKm: z.number().int().min(0).optional().nullable(),
  proximoService: z.string().optional().nullable(),
  tecnicoReferenteId: z.number().int().optional().nullable(),
  tecnicoId: z.number().int().optional().nullable(),
  conductorId: z.number().int().optional().nullable(),
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
          tecnicoReferente: { select: { id: true, nombre: true, apellido: true } },
          tecnico: { select: { id: true, nombre: true, apellido: true } },
          conductor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              fechaVencimientoRegistro: true,
            },
          },
          _count: { select: { multas: true } },
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

    // Validar tecnico referente
    if (body.tecnicoReferenteId) {
      const emp = await prisma.empleado.findFirst({
        where: {
          id: body.tecnicoReferenteId,
          fechaEliminacion: null,
          estado: 'ACTIVO',
          tipo: 'TECNICO',
          esReferente: true,
        },
      });
      if (!emp)
        return res.status(400).json({ error: 'El técnico referente seleccionado no es válido.' });
    }

    // Validar tecnico
    if (body.tecnicoId) {
      const emp = await prisma.empleado.findFirst({
        where: { id: body.tecnicoId, fechaEliminacion: null, estado: 'ACTIVO', tipo: 'TECNICO' },
      });
      if (!emp) return res.status(400).json({ error: 'El técnico seleccionado no es válido.' });
    }

    // Validar conductor
    if (body.conductorId) {
      const emp = await prisma.empleado.findFirst({
        where: { id: body.conductorId, fechaEliminacion: null, estado: 'ACTIVO' },
      });
      if (!emp) return res.status(400).json({ error: 'El conductor seleccionado no es válido.' });
    }

    const newVehiculo = await prisma.vehiculo.create({
      data: {
        ...body,
        fechaVencimientoVTV: body.fechaVencimientoVTV
          ? new Date(body.fechaVencimientoVTV as string)
          : null,
        fechaCambioAceite: body.fechaCambioAceite
          ? new Date(body.fechaCambioAceite as string)
          : null,
        proximoService: body.proximoService ? new Date(body.proximoService as string) : null,
        zonaId: body.zonaId ?? null,
        tecnicoReferenteId: body.tecnicoReferenteId ?? null,
        tecnicoId: body.tecnicoId ?? null,
        conductorId: body.conductorId ?? null,
      },
      include: {
        zona: { select: { nombre: true } },
        tecnicoReferente: { select: { id: true, nombre: true, apellido: true } },
        tecnico: { select: { id: true, nombre: true, apellido: true } },
        conductor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            fechaVencimientoRegistro: true,
          },
        },
        _count: { select: { multas: true } },
      },
    });

    res.status(201).json(newVehiculo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
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

    // Validar tecnico referente
    if (body.tecnicoReferenteId) {
      const emp = await prisma.empleado.findFirst({
        where: {
          id: body.tecnicoReferenteId,
          fechaEliminacion: null,
          estado: 'ACTIVO',
          tipo: 'TECNICO',
          esReferente: true,
        },
      });
      if (!emp)
        return res.status(400).json({ error: 'El técnico referente seleccionado no es válido.' });
    }

    // Validar tecnico
    if (body.tecnicoId) {
      const emp = await prisma.empleado.findFirst({
        where: { id: body.tecnicoId, fechaEliminacion: null, estado: 'ACTIVO', tipo: 'TECNICO' },
      });
      if (!emp) return res.status(400).json({ error: 'El técnico seleccionado no es válido.' });
    }

    // Validar conductor
    if (body.conductorId) {
      const emp = await prisma.empleado.findFirst({
        where: { id: body.conductorId, fechaEliminacion: null, estado: 'ACTIVO' },
      });
      if (!emp) return res.status(400).json({ error: 'El conductor seleccionado no es válido.' });
    }

    const updated = await prisma.vehiculo.update({
      where: { id },
      data: {
        ...body,
        fechaVencimientoVTV:
          body.fechaVencimientoVTV === undefined
            ? undefined
            : body.fechaVencimientoVTV
              ? new Date(body.fechaVencimientoVTV as string)
              : null,
        fechaCambioAceite:
          body.fechaCambioAceite === undefined
            ? undefined
            : body.fechaCambioAceite
              ? new Date(body.fechaCambioAceite as string)
              : null,
        proximoService:
          body.proximoService === undefined
            ? undefined
            : body.proximoService
              ? new Date(body.proximoService as string)
              : null,
        zonaId: body.zonaId === undefined ? undefined : (body.zonaId ?? null),
        tecnicoReferenteId:
          body.tecnicoReferenteId === undefined ? undefined : (body.tecnicoReferenteId ?? null),
        tecnicoId: body.tecnicoId === undefined ? undefined : (body.tecnicoId ?? null),
        conductorId: body.conductorId === undefined ? undefined : (body.conductorId ?? null),
      },
      include: {
        zona: { select: { nombre: true } },
        tecnicoReferente: { select: { id: true, nombre: true, apellido: true } },
        tecnico: { select: { id: true, nombre: true, apellido: true } },
        conductor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            fechaVencimientoRegistro: true,
          },
        },
        _count: { select: { multas: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
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

export const getResumen = async (_req: Request, res: Response) => {
  try {
    const noEliminado = { fechaEliminacion: null };
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);
    const hace90Dias = new Date();
    hace90Dias.setDate(hace90Dias.getDate() - 90);

    const [totalActivos, enTaller, fueraServicio] = await prisma.$transaction([
      prisma.vehiculo.count({ where: { ...noEliminado, estado: 'ACTIVO' } }),
      prisma.vehiculo.count({ where: { ...noEliminado, estado: 'TALLER' } }),
      prisma.vehiculo.count({ where: { ...noEliminado, estado: 'FUERA_SERVICIO' } }),
    ]);

    // VTV por vencer (en los proximos 30 dias o ya vencida)
    const vtvPorVencer = await prisma.vehiculo.count({
      where: {
        ...noEliminado,
        fechaVencimientoVTV: { lte: en30Dias },
      },
    });

    // Aceite por cambiar (hace mas de 90 dias)
    const aceitePorCambiar = await prisma.vehiculo.count({
      where: {
        ...noEliminado,
        fechaCambioAceite: { lte: hace90Dias },
      },
    });

    // Multas pendientes
    const multasPendientes = await prisma.multaVehiculo.count({
      where: {
        estado: 'PENDIENTE',
        vehiculo: noEliminado,
      },
    });

    res.json({
      totalActivos,
      enTaller,
      fueraServicio,
      vtvPorVencer,
      aceitePorCambiar,
      multasPendientes,
    });
  } catch (error) {
    console.error('Error al obtener resumen de vehiculos:', error);
    res.status(500).json({ error: 'Error al obtener resumen de vehiculos' });
  }
};
