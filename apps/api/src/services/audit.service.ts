import { prisma } from '../lib/prisma.js';

interface RegistrarEventoParams {
  usuarioId: number;
  accion: string;
  modulo: string;
  entidadId?: number | null;
  entidadTipo?: string | null;
  descripcion: string;
  detalle?: Record<string, unknown> | null;
  ip?: string | null;
  obraId?: number | null;
  ticketId?: number | null;
  clienteId?: number | null;
}

export async function registrarEvento(params: RegistrarEventoParams) {
  try {
    await prisma.eventoAuditoria.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        modulo: params.modulo,
        entidadId: params.entidadId ?? null,
        entidadTipo: params.entidadTipo ?? null,
        descripcion: params.descripcion,
        detalle: params.detalle ? JSON.stringify(params.detalle) : null,
        ip: params.ip ?? null,
        obraId: params.obraId ?? null,
        ticketId: params.ticketId ?? null,
        clienteId: params.clienteId ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('[Audit] Error registering event:', error);
  }
}

export function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || null;
}
