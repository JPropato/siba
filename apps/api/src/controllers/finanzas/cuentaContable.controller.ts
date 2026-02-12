import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoCuentaContable, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createCuentaContableSchema = z.object({
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(2).max(100),
  tipo: z.nativeEnum(TipoCuentaContable),
  nivel: z.number().int().min(1).max(5),
  parentId: z.number().int().positive().optional().nullable(),
  imputable: z.boolean().default(true),
  descripcion: z.string().max(500).optional().nullable(),
});

// =====================================================
// CUENTAS CONTABLES
// =====================================================

export const getCuentasContables = async (req: Request, res: Response) => {
  try {
    const { tipo, imputable, activa } = req.query;

    const where: {
      tipo?: TipoCuentaContable;
      imputable?: boolean;
      activa?: boolean;
    } = {};

    if (tipo) where.tipo = tipo as TipoCuentaContable;
    if (imputable === 'true') where.imputable = true;
    if (imputable === 'false') where.imputable = false;
    if (activa === 'false') where.activa = false;
    else where.activa = true; // By default only active

    const cuentas = await prisma.cuentaContable.findMany({
      where,
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { codigo: 'asc' },
    });

    res.json(cuentas);
  } catch (error) {
    console.error('[Finanzas] getCuentasContables error:', error);
    res.status(500).json({ error: 'Error al obtener cuentas contables' });
  }
};

export const createCuentaContable = async (req: Request, res: Response) => {
  try {
    const data = createCuentaContableSchema.parse(req.body);

    // Validate parent exists and has same tipo
    if (data.parentId) {
      const parent = await prisma.cuentaContable.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        return res.status(400).json({ error: 'Cuenta padre no encontrada' });
      }
      if (parent.tipo !== data.tipo) {
        return res.status(400).json({ error: 'La cuenta padre debe ser del mismo tipo' });
      }
    }

    const cuenta = await prisma.cuentaContable.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        nivel: data.nivel,
        parentId: data.parentId ?? null,
        imputable: data.imputable,
        descripcion: data.descripcion ?? null,
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    res.status(201).json(cuenta);
  } catch (error) {
    console.error('[Finanzas] createCuentaContable error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una cuenta contable con ese codigo' });
    }
    res.status(500).json({ error: 'Error al crear cuenta contable' });
  }
};

export const updateCuentaContable = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.cuentaContable.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cuenta contable no encontrada' });
    }

    const data = createCuentaContableSchema.partial().parse(req.body);

    // Don't allow changing tipo if has movimientos
    if (data.tipo && data.tipo !== existing.tipo) {
      const movCount = await prisma.movimiento.count({ where: { cuentaContableId: id } });
      if (movCount > 0) {
        return res.status(400).json({
          error: 'No se puede cambiar el tipo de una cuenta con movimientos asignados',
        });
      }
    }

    const cuenta = await prisma.cuentaContable.update({
      where: { id },
      data: {
        ...(data.codigo !== undefined && { codigo: data.codigo }),
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.nivel !== undefined && { nivel: data.nivel }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
        ...(data.imputable !== undefined && { imputable: data.imputable }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
      },
      include: {
        parent: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    res.json(cuenta);
  } catch (error) {
    console.error('[Finanzas] updateCuentaContable error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar cuenta contable' });
  }
};

export const deleteCuentaContable = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.cuentaContable.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Cuenta contable no encontrada' });
    }

    // Check for movimientos
    const movCount = await prisma.movimiento.count({ where: { cuentaContableId: id } });
    if (movCount > 0) {
      return res
        .status(400)
        .json({ error: `No se puede desactivar: tiene ${movCount} movimientos asignados` });
    }

    // Check for active children
    const hijosActivos = await prisma.cuentaContable.count({
      where: { parentId: id, activa: true },
    });
    if (hijosActivos > 0) {
      return res
        .status(400)
        .json({ error: `No se puede desactivar: tiene ${hijosActivos} subcuentas activas` });
    }

    // Soft delete
    const cuenta = await prisma.cuentaContable.update({
      where: { id },
      data: { activa: false },
    });

    res.json(cuenta);
  } catch (error) {
    console.error('[Finanzas] deleteCuentaContable error:', error);
    res.status(500).json({ error: 'Error al desactivar cuenta contable' });
  }
};
