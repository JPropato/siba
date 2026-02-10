import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { getUserId, logHistorial } from './utils.js';

const addNotaSchema = z.object({
  contenido: z.string().min(1, 'El contenido es requerido').max(2000),
});

export const addNota = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { contenido } = addNotaSchema.parse(req.body);
    const userId = getUserId(req);

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await logHistorial(id, userId, 'nota', null, null, contenido);

    res.status(201).json({ message: 'Nota agregada correctamente' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al agregar nota:', error);
    res.status(500).json({ error: 'Error al agregar nota' });
  }
};
