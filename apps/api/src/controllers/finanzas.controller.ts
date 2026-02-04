import { Request, Response } from 'express';
import { z } from 'zod';
import {
  TipoMovimiento,
  TipoCuenta,
  MedioPago,
  CategoriaIngreso,
  CategoriaEgreso,
  EstadoMovimiento,
  Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const createBancoSchema = z.object({
  codigo: z.string().min(1).max(10),
  nombre: z.string().min(3).max(200),
  nombreCorto: z.string().min(1).max(50),
  logo: z.string().url().optional().nullable(),
});

const createCuentaSchema = z.object({
  nombre: z.string().min(3).max(100),
  tipo: z.nativeEnum(TipoCuenta),
  bancoId: z.number().int().positive().optional().nullable(),
  numeroCuenta: z.string().max(50).optional().nullable(),
  cbu: z.string().max(30).optional().nullable(),
  alias: z.string().max(50).optional().nullable(),
  saldoInicial: z.number().default(0),
  moneda: z.string().default('ARS'),
  tipoInversion: z.string().optional().nullable(),
  tasaAnual: z.number().optional().nullable(),
  fechaVencimiento: z.string().datetime().optional().nullable(),
});

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
// UTILIDADES
// =====================================================

async function actualizarSaldoCuenta(cuentaId: number) {
  const cuenta = await prisma.cuentaFinanciera.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return;

  const ingresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'INGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const egresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'EGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const saldoIngresos = Number(ingresos._sum.monto || 0);
  const saldoEgresos = Number(egresos._sum.monto || 0);
  const saldoActual = Number(cuenta.saldoInicial) + saldoIngresos - saldoEgresos;

  await prisma.cuentaFinanciera.update({
    where: { id: cuentaId },
    data: { saldoActual },
  });
}

// =====================================================
// BANCOS
// =====================================================

export const getBancos = async (_req: Request, res: Response) => {
  try {
    const bancos = await prisma.banco.findMany({
      where: { activo: true },
      orderBy: { nombreCorto: 'asc' },
    });
    res.json(bancos);
  } catch (error) {
    console.error('[Finanzas] getBancos error:', error);
    res.status(500).json({ error: 'Error al obtener bancos' });
  }
};

export const createBanco = async (req: Request, res: Response) => {
  try {
    const data = createBancoSchema.parse(req.body);
    const banco = await prisma.banco.create({ data });
    res.status(201).json(banco);
  } catch (error) {
    console.error('[Finanzas] createBanco error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear banco' });
  }
};

export const updateBanco = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = createBancoSchema.partial().parse(req.body);
    const banco = await prisma.banco.update({ where: { id }, data });
    res.json(banco);
  } catch (error) {
    console.error('[Finanzas] updateBanco error:', error);
    res.status(500).json({ error: 'Error al actualizar banco' });
  }
};

// =====================================================
// CUENTAS FINANCIERAS
// =====================================================

export const getCuentas = async (_req: Request, res: Response) => {
  try {
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { activa: true },
      include: { banco: { select: { id: true, nombreCorto: true, logo: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(cuentas);
  } catch (error) {
    console.error('[Finanzas] getCuentas error:', error);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
};

export const getCuentaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cuenta = await prisma.cuentaFinanciera.findUnique({
      where: { id },
      include: {
        banco: true,
        movimientos: {
          take: 10,
          orderBy: { fechaMovimiento: 'desc' },
        },
      },
    });
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(cuenta);
  } catch (error) {
    console.error('[Finanzas] getCuentaById error:', error);
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
};

export const createCuenta = async (req: Request, res: Response) => {
  try {
    const data = createCuentaSchema.parse(req.body);
    const cuenta = await prisma.cuentaFinanciera.create({
      data: {
        ...data,
        saldoActual: data.saldoInicial,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
      },
      include: { banco: true },
    });
    res.status(201).json(cuenta);
  } catch (error) {
    console.error('[Finanzas] createCuenta error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};

export const updateCuenta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = createCuentaSchema.partial().parse(req.body);
    const cuenta = await prisma.cuentaFinanciera.update({
      where: { id },
      data: {
        ...data,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
      },
      include: { banco: true },
    });
    res.json(cuenta);
  } catch (error) {
    console.error('[Finanzas] updateCuenta error:', error);
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
};

export const deleteCuenta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.cuentaFinanciera.update({
      where: { id },
      data: { activa: false },
    });
    res.status(204).send();
  } catch (error) {
    console.error('[Finanzas] deleteCuenta error:', error);
    res.status(500).json({ error: 'Error al desactivar cuenta' });
  }
};

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

// =====================================================
// DASHBOARD / REPORTES
// =====================================================

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    // Saldos totales por tipo de cuenta
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { activa: true },
      include: { banco: { select: { nombreCorto: true } } },
    });

    const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

    // Movimientos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosMes = await prisma.movimiento.aggregate({
      where: {
        tipo: 'INGRESO',
        estado: { not: 'ANULADO' },
        fechaMovimiento: { gte: inicioMes },
      },
      _sum: { monto: true },
      _count: true,
    });

    const egresosMes = await prisma.movimiento.aggregate({
      where: {
        tipo: 'EGRESO',
        estado: { not: 'ANULADO' },
        fechaMovimiento: { gte: inicioMes },
      },
      _sum: { monto: true },
      _count: true,
    });

    // Últimos 5 movimientos
    const ultimosMovimientos = await prisma.movimiento.findMany({
      where: { estado: { not: 'ANULADO' } },
      include: {
        cuenta: { select: { nombre: true } },
      },
      orderBy: { fechaMovimiento: 'desc' },
      take: 5,
    });

    res.json({
      saldoTotal,
      ingresosMes: {
        monto: Number(ingresosMes._sum.monto || 0),
        cantidad: ingresosMes._count,
      },
      egresosMes: {
        monto: Number(egresosMes._sum.monto || 0),
        cantidad: egresosMes._count,
      },
      balanceMes: Number(ingresosMes._sum.monto || 0) - Number(egresosMes._sum.monto || 0),
      cuentas: cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        banco: c.banco?.nombreCorto,
        saldoActual: Number(c.saldoActual),
      })),
      ultimosMovimientos,
    });
  } catch (error) {
    console.error('[Finanzas] getDashboard error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

export const getSaldos = async (_req: Request, res: Response) => {
  try {
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { activa: true },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        saldoActual: true,
        moneda: true,
        banco: { select: { nombreCorto: true } },
      },
      orderBy: { saldoActual: 'desc' },
    });

    const total = cuentas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

    res.json({ cuentas, total });
  } catch (error) {
    console.error('[Finanzas] getSaldos error:', error);
    res.status(500).json({ error: 'Error al obtener saldos' });
  }
};
