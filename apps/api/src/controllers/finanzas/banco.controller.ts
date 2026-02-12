import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createBancoSchema = z.object({
  codigo: z.string().min(1).max(10),
  nombre: z.string().min(3).max(200),
  nombreCorto: z.string().min(1).max(50),
  logo: z.string().url().optional().nullable(),
});

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
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
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
