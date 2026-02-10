import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

/**
 * GET /api/tickets/reference-data
 * Returns minimal reference data needed for ticket forms (dropdowns).
 * Protected by tickets:leer — no need for clientes:leer, sedes:leer, etc.
 */
export const getReferenceData = async (_req: Request, res: Response) => {
  try {
    const [clientes, sedes, tecnicos] = await Promise.all([
      prisma.cliente.findMany({
        where: { fechaEliminacion: null },
        select: { id: true, razonSocial: true },
        orderBy: { razonSocial: 'asc' },
      }),
      prisma.sucursal.findMany({
        where: { fechaEliminacion: null },
        select: {
          id: true,
          nombre: true,
          clienteId: true,
          direccion: true,
          zona: { select: { id: true, nombre: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.empleado.findMany({
        where: { tipo: 'TECNICO', fechaEliminacion: null },
        select: { id: true, nombre: true, apellido: true },
        orderBy: { apellido: 'asc' },
      }),
    ]);

    res.json({ clientes, sedes, tecnicos });
  } catch (error) {
    console.error('Error fetching ticket reference data:', error);
    res.status(500).json({ error: 'Error al obtener datos de referencia' });
  }
};
