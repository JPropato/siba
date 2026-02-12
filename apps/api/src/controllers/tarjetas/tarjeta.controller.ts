import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface ProveedorBasic {
  id: number;
  razonSocial: string;
  nombreFantasia: string | null;
  cuit: string;
  condicionIVA: string;
  activo: boolean;
}

const createSchema = z.object({
  tipo: z.enum(['PRECARGABLE', 'CORPORATIVA']),
  tipoTarjetaFinanciera: z.enum(['CREDITO', 'DEBITO', 'PREPAGA']).optional(),
  redProcesadora: z
    .enum(['VISA', 'MASTERCARD', 'CABAL', 'NARANJA', 'AMERICAN_EXPRESS', 'MAESTRO'])
    .optional(),
  empleadoId: z.number().int().positive(),
  cuentaFinancieraId: z.number().int().positive(),
  numeroTarjeta: z.string().optional(),
  alias: z.string().optional(),
  bancoId: z.number().int().positive().optional(),
});

const updateSchema = createSchema.partial().omit({ tipo: true, cuentaFinancieraId: true });

export async function getAll(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search as string)?.trim() || '';
    const tipo = req.query.tipo as string;
    const estado = req.query.estado as string;
    const empleadoId = req.query.empleadoId ? Number(req.query.empleadoId) : undefined;

    const where: Prisma.TarjetaPrecargableWhereInput = { fechaEliminacion: null };
    if (tipo) where.tipo = tipo as Prisma.EnumTipoTarjetaFilter;
    if (estado) where.estado = estado as Prisma.EnumEstadoTarjetaFilter;
    if (empleadoId) where.empleadoId = empleadoId;
    if (search) {
      where.OR = [
        { alias: { contains: search, mode: 'insensitive' } },
        { numeroTarjeta: { contains: search, mode: 'insensitive' } },
        { empleado: { apellido: { contains: search, mode: 'insensitive' } } },
        { empleado: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tarjetaPrecargable.findMany({
        where,
        include: {
          empleado: { select: { id: true, nombre: true, apellido: true, esReferente: true } },
          cuentaFinanciera: { select: { id: true, nombre: true, saldoActual: true, tipo: true } },
          banco: { select: { id: true, nombreCorto: true } },
          _count: { select: { gastos: true, cargas: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tarjetaPrecargable.count({ where }),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Tarjetas] getAll error:', error);
    res.status(500).json({ error: 'Error al obtener tarjetas' });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const tarjeta = await prisma.tarjetaPrecargable.findFirst({
      where: { id, fechaEliminacion: null },
      include: {
        empleado: {
          select: { id: true, nombre: true, apellido: true, esReferente: true, tipo: true },
        },
        cuentaFinanciera: {
          select: { id: true, nombre: true, saldoActual: true, tipo: true, moneda: true },
        },
        banco: { select: { id: true, nombre: true, nombreCorto: true } },
        cargas: {
          orderBy: { fecha: 'desc' },
          take: 10,
          include: { movimiento: { select: { id: true, codigo: true, estado: true } } },
        },
        gastos: {
          orderBy: { fecha: 'desc' },
          take: 10,
          include: {
            movimiento: { select: { id: true, codigo: true, estado: true } },
            centroCosto: { select: { id: true, codigo: true, nombre: true } },
            ticket: { select: { id: true, codigoInterno: true, descripcion: true } },
            archivos: true,
          },
        },
        rendiciones: { orderBy: { fechaCreacion: 'desc' }, take: 5 },
        _count: { select: { gastos: true, cargas: true, rendiciones: true } },
      },
    });
    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });
    res.json(tarjeta);
  } catch (error) {
    console.error('[Tarjetas] getById error:', error);
    res.status(500).json({ error: 'Error al obtener tarjeta' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = createSchema.parse(req.body);

    // Validate empleado exists
    const empleado = await prisma.empleado.findFirst({
      where: { id: data.empleadoId, fechaEliminacion: null },
    });
    if (!empleado) return res.status(400).json({ error: 'Empleado no encontrado' });

    // Validate cuentaFinanciera exists
    const cuenta = await prisma.cuentaFinanciera.findFirst({
      where: { id: data.cuentaFinancieraId, activa: true },
    });
    if (!cuenta)
      return res.status(400).json({ error: 'Cuenta financiera no encontrada o inactiva' });

    // Unique check on numeroTarjeta
    if (data.numeroTarjeta) {
      const exists = await prisma.tarjetaPrecargable.findFirst({
        where: { numeroTarjeta: data.numeroTarjeta, fechaEliminacion: null },
      });
      if (exists) return res.status(400).json({ error: 'Ya existe una tarjeta con ese número' });
    }

    const tarjeta = await prisma.tarjetaPrecargable.create({
      data,
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true } },
        cuentaFinanciera: { select: { id: true, nombre: true, saldoActual: true } },
        banco: { select: { id: true, nombreCorto: true } },
      },
    });

    res.status(201).json(tarjeta);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Tarjetas] create error:', error);
    res.status(500).json({ error: 'Error al crear tarjeta' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = updateSchema.parse(req.body);

    const existing = await prisma.tarjetaPrecargable.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!existing) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    if (data.numeroTarjeta && data.numeroTarjeta !== existing.numeroTarjeta) {
      const dup = await prisma.tarjetaPrecargable.findFirst({
        where: { numeroTarjeta: data.numeroTarjeta, fechaEliminacion: null, id: { not: id } },
      });
      if (dup) return res.status(400).json({ error: 'Ya existe una tarjeta con ese número' });
    }

    const tarjeta = await prisma.tarjetaPrecargable.update({
      where: { id },
      data,
      include: {
        empleado: { select: { id: true, nombre: true, apellido: true } },
        cuentaFinanciera: { select: { id: true, nombre: true, saldoActual: true } },
        banco: { select: { id: true, nombreCorto: true } },
      },
    });

    res.json(tarjeta);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Tarjetas] update error:', error);
    res.status(500).json({ error: 'Error al actualizar tarjeta' });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.tarjetaPrecargable.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!existing) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    await prisma.tarjetaPrecargable.update({
      where: { id },
      data: { fechaEliminacion: new Date(), estado: 'BAJA' },
    });

    res.json({ message: 'Tarjeta eliminada' });
  } catch (error) {
    console.error('[Tarjetas] delete error:', error);
    res.status(500).json({ error: 'Error al eliminar tarjeta' });
  }
}

export async function getResumen(req: Request, res: Response) {
  try {
    const where = { fechaEliminacion: null };
    const [total, precargables, corporativas, activas] = await Promise.all([
      prisma.tarjetaPrecargable.count({ where }),
      prisma.tarjetaPrecargable.count({ where: { ...where, tipo: 'PRECARGABLE' } }),
      prisma.tarjetaPrecargable.count({ where: { ...where, tipo: 'CORPORATIVA' } }),
      prisma.tarjetaPrecargable.count({ where: { ...where, estado: 'ACTIVA' } }),
    ]);

    // Saldo total precargables
    const tarjetasPrecargables = await prisma.tarjetaPrecargable.findMany({
      where: { ...where, tipo: 'PRECARGABLE' },
      include: { cuentaFinanciera: { select: { saldoActual: true } } },
    });
    const saldoPrecargables = tarjetasPrecargables.reduce(
      (acc, t) => acc + Number(t.cuentaFinanciera.saldoActual),
      0
    );

    // Gastos del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const gastosMes = await prisma.gastoTarjeta.aggregate({
      where: { fecha: { gte: inicioMes }, movimiento: { estado: { not: 'ANULADO' } } },
      _sum: { monto: true },
      _count: true,
    });

    // Rendiciones pendientes (CERRADA esperando aprobacion)
    const rendicionesPendientes = await prisma.rendicion.count({
      where: { estado: 'CERRADA' },
    });

    res.json({
      total,
      precargables,
      corporativas,
      activas,
      saldoPrecargables,
      gastosMes: Number(gastosMes._sum.monto || 0),
      cantidadGastosMes: gastosMes._count,
      rendicionesPendientes,
    });
  } catch (error) {
    console.error('[Tarjetas] getResumen error:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
}

export async function getProveedoresFrecuentes(req: Request, res: Response) {
  try {
    const tarjetaId = Number(req.params.tarjetaId);

    // Verify tarjeta exists
    const tarjeta = await prisma.tarjetaPrecargable.findFirst({
      where: { id: tarjetaId, fechaEliminacion: null },
    });
    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    // Get gastos with proveedor, group by proveedorId and count
    const gastosConProveedor = await prisma.gastoTarjeta.findMany({
      where: {
        tarjetaId,
        proveedorId: { not: null },
      },
      select: {
        proveedorId: true,
        proveedor: {
          select: {
            id: true,
            razonSocial: true,
            nombreFantasia: true,
            cuit: true,
            condicionIVA: true,
            activo: true,
          },
        },
      },
    });

    // Group by proveedorId and count frequency
    const frecuenciaMap = new Map<number, { proveedor: ProveedorBasic; count: number }>();

    gastosConProveedor.forEach((gasto) => {
      if (gasto.proveedorId && gasto.proveedor) {
        const existing = frecuenciaMap.get(gasto.proveedorId);
        if (existing) {
          existing.count++;
        } else {
          frecuenciaMap.set(gasto.proveedorId, {
            proveedor: gasto.proveedor,
            count: 1,
          });
        }
      }
    });

    // Convert to array and sort by frequency descending
    const proveedores = Array.from(frecuenciaMap.values())
      .sort((a, b) => b.count - a.count)
      .map(({ proveedor, count }) => ({
        ...proveedor,
        vecesUsado: count,
      }));

    res.json(proveedores);
  } catch (error) {
    console.error('[Tarjetas] getProveedoresFrecuentes error:', error);
    res.status(500).json({ error: 'Error al obtener proveedores frecuentes' });
  }
}
