import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function getAll(req: Request, res: Response) {
  try {
    const categorias = await prisma.configCategoriaGasto.findMany({
      include: {
        cuentaContable: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { id: 'asc' },
    });

    res.json(categorias);
  } catch (error) {
    console.error('[ConfigCategoria] getAll error:', error);
    res.status(500).json({ error: 'Error al obtener configuración de categorías' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { cuentaContableId } = z
      .object({ cuentaContableId: z.number().int().positive() })
      .parse(req.body);

    const config = await prisma.configCategoriaGasto.findUnique({ where: { id } });
    if (!config) return res.status(404).json({ error: 'Configuración no encontrada' });

    const cuenta = await prisma.cuentaContable.findUnique({ where: { id: cuentaContableId } });
    if (!cuenta) return res.status(400).json({ error: 'Cuenta contable no encontrada' });
    if (!cuenta.imputable)
      return res.status(400).json({ error: 'La cuenta contable debe ser imputable' });

    const updated = await prisma.configCategoriaGasto.update({
      where: { id },
      data: { cuentaContableId },
      include: {
        cuentaContable: { select: { id: true, codigo: true, nombre: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[ConfigCategoria] update error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
}
