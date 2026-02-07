import { Request } from 'express';
import { prisma } from '../../lib/prisma.js';

// Helper to get user ID from request
export const getUserId = (req: Request): number => {
  const user = (req as Request & { user?: { id: number } }).user;
  return user?.id || 1;
};

// Helper to log ticket history
export const logHistorial = async (
  ticketId: number,
  usuarioId: number,
  campo: string,
  valorAnterior: string | null,
  valorNuevo: string | null,
  observacion?: string
) => {
  await prisma.ticketHistorial.create({
    data: {
      ticketId,
      usuarioId,
      campoModificado: campo,
      valorAnterior,
      valorNuevo,
      observacion,
    },
  });
};
