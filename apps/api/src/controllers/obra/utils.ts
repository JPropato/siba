import { Request } from 'express';
import { z } from 'zod';
import { TipoObra, EstadoObra, ModoEjecucion } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// --- Schemas ---
export const createObraSchema = z.object({
  tipo: z.nativeEnum(TipoObra),
  modoEjecucion: z.nativeEnum(ModoEjecucion).optional().default(ModoEjecucion.CON_PRESUPUESTO),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().optional().nullable(),
  fechaSolicitud: z.string().datetime().or(z.date()),
  fechaInicioEstimada: z.string().datetime().or(z.date()).optional().nullable(),
  fechaFinEstimada: z.string().datetime().or(z.date()).optional().nullable(),
  clienteId: z.number().int(),
  sucursalId: z.number().int().optional().nullable(),
  ticketId: z.number().int().optional().nullable(),
  condicionesPago: z.string().optional().nullable(),
  validezDias: z.number().int().optional().default(30),
});

export const updateObraSchema = createObraSchema.partial().extend({
  fechaInicioReal: z.string().datetime().or(z.date()).optional().nullable(),
  fechaFinReal: z.string().datetime().or(z.date()).optional().nullable(),
  numeroFactura: z.string().optional().nullable(),
  fechaFacturacion: z.string().datetime().or(z.date()).optional().nullable(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoObra),
  observacion: z.string().optional(),
});

// --- Helper Functions ---
export function getUserId(req: Request): number {
  return req.user?.id || 1;
}

export async function generateCodigo(): Promise<string> {
  const lastObra = await prisma.obra.findFirst({
    orderBy: { id: 'desc' },
    select: { codigo: true },
  });

  let nextNum = 1;
  if (lastObra?.codigo) {
    const match = lastObra.codigo.match(/OBR-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `OBR-${String(nextNum).padStart(5, '0')}`;
}

// Validacion de transiciones de estado
export const TRANSICIONES_VALIDAS: Record<EstadoObra, EstadoObra[]> = {
  [EstadoObra.BORRADOR]: [EstadoObra.PRESUPUESTADO, EstadoObra.EN_EJECUCION],
  [EstadoObra.PRESUPUESTADO]: [EstadoObra.APROBADO, EstadoObra.RECHAZADO, EstadoObra.BORRADOR],
  [EstadoObra.APROBADO]: [EstadoObra.EN_EJECUCION],
  [EstadoObra.RECHAZADO]: [EstadoObra.BORRADOR],
  [EstadoObra.EN_EJECUCION]: [EstadoObra.FINALIZADO],
  [EstadoObra.FINALIZADO]: [EstadoObra.FACTURADO],
  [EstadoObra.FACTURADO]: [],
};
