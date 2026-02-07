import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoCuenta } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

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
