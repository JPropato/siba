import { Request, Response } from 'express';
import { z } from 'zod';
import {
  TipoMovimiento,
  MedioPago,
  CategoriaIngreso,
  CategoriaEgreso,
  EstadoMovimiento,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from './utils.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createMovimientoSchema = z.object({
  tipo: z.nativeEnum(TipoMovimiento),
  categoriaIngreso: z.nativeEnum(CategoriaIngreso).optional().nullable(),
  categoriaEgreso: z.nativeEnum(CategoriaEgreso).optional().nullable(),
  medioPago: z.nativeEnum(MedioPago),
  monto: z.number().positive(),
  moneda: z.string().default('ARS'),
  descripcion: z.string().min(3).max(500),
  comprobante: z.string().max(100).optional().nullable(),
  fechaMovimiento: z.string().datetime(),
  cuentaId: z.number().int().positive(),
  clienteId: z.number().int().positive().optional().nullable(),
  ticketId: z.number().int().positive().optional().nullable(),
  obraId: z.number().int().positive().optional().nullable(),
  empleadoId: z.number().int().positive().optional().nullable(),
});

// =====================================================
// MOVIMIENTOS
// =====================================================

export const getMovimientos = async (req: Request, res: Response) => {
  try {
    const {
      cuentaId,
      tipo,
      estado,
      fechaDesde,
      fechaHasta,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const where: Prisma.MovimientoWhereInput = {};

    if (cuentaId) where.cuentaId = Number(cuentaId);
    if (tipo) where.tipo = tipo as TipoMovimiento;
    if (estado) where.estado = estado as EstadoMovimiento;
    if (fechaDesde || fechaHasta) {
      where.fechaMovimiento = {};
      if (fechaDesde) where.fechaMovimiento.gte = new Date(fechaDesde as string);
      if (fechaHasta) where.fechaMovimiento.lte = new Date(fechaHasta as string);
    }
    if (search) {
      where.OR = [
        { descripcion: { contains: search as string, mode: 'insensitive' } },
        { comprobante: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [movimientos, total] = await Promise.all([
      prisma.movimiento.findMany({
        where,
        include: {
          cuenta: { select: { id: true, nombre: true } },
          cliente: { select: { id: true, razonSocial: true } },
          obra: { select: { id: true, codigo: true, titulo: true } },
          ticket: { select: { id: true, codigoInterno: true } },
          registradoPor: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { fechaMovimiento: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.movimiento.count({ where }),
    ]);

    res.json({
      data: movimientos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[Finanzas] getMovimientos error:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};

export const getMovimientoById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const movimiento = await prisma.movimiento.findUnique({
      where: { id },
      include: {
        cuenta: true,
        cliente: true,
        obra: true,
        ticket: true,
        empleado: true,
        registradoPor: true,
      },
    });
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json(movimiento);
  } catch (error) {
    console.error('[Finanzas] getMovimientoById error:', error);
    res.status(500).json({ error: 'Error al obtener movimiento' });
  }
};

export const createMovimiento = async (req: Request, res: Response) => {
  try {
    const data = createMovimientoSchema.parse(req.body);
    const userId = req.user?.id || 1;

    const movimiento = await prisma.movimiento.create({
      data: {
        ...data,
        fechaMovimiento: new Date(data.fechaMovimiento),
        registradoPorId: userId,
      },
      include: {
        cuenta: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, razonSocial: true } },
      },
    });

    // Actualizar saldo de la cuenta
    await actualizarSaldoCuenta(data.cuentaId);

    res.status(201).json(movimiento);
  } catch (error) {
    console.error('[Finanzas] createMovimiento error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear movimiento' });
  }
};

export const updateMovimiento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Solo permitir editar si está PENDIENTE
    const existing = await prisma.movimiento.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    if (existing.estado !== 'PENDIENTE') {
      return res
        .status(400)
        .json({ error: 'Solo se pueden editar movimientos en estado PENDIENTE' });
    }

    const data = createMovimientoSchema.partial().parse(req.body);
    const movimiento = await prisma.movimiento.update({
      where: { id },
      data: {
        ...data,
        fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento) : undefined,
      },
    });

    // Recalcular saldo
    await actualizarSaldoCuenta(movimiento.cuentaId);

    res.json(movimiento);
  } catch (error) {
    console.error('[Finanzas] updateMovimiento error:', error);
    res.status(500).json({ error: 'Error al actualizar movimiento' });
  }
};

export const anularMovimiento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body;

    const existing = await prisma.movimiento.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    if (existing.estado === 'ANULADO') {
      return res.status(400).json({ error: 'El movimiento ya está anulado' });
    }

    const movimiento = await prisma.movimiento.update({
      where: { id },
      data: {
        estado: 'ANULADO',
        descripcion: existing.descripcion + (motivo ? ` [ANULADO: ${motivo}]` : ' [ANULADO]'),
      },
    });

    // Recalcular saldo
    await actualizarSaldoCuenta(movimiento.cuentaId);

    res.json(movimiento);
  } catch (error) {
    console.error('[Finanzas] anularMovimiento error:', error);
    res.status(500).json({ error: 'Error al anular movimiento' });
  }
};

export const confirmarMovimiento = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.movimiento.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    if (existing.estado !== 'PENDIENTE') {
      return res
        .status(400)
        .json({ error: 'Solo se pueden confirmar movimientos en estado PENDIENTE' });
    }

    const movimiento = await prisma.movimiento.update({
      where: { id },
      data: { estado: 'CONFIRMADO' },
    });

    res.json(movimiento);
  } catch (error) {
    console.error('[Finanzas] confirmarMovimiento error:', error);
    res.status(500).json({ error: 'Error al confirmar movimiento' });
  }
};
