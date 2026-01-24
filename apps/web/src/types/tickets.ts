import type {
  RubroTicket,
  PrioridadTicket,
  EstadoTicket,
  Ticket,
  TicketFormData,
  TicketHistorial as SharedTicketHistorial,
} from '@siba/shared';
import { RUBRO_LABELS, PRIORIDAD_LABELS, ESTADO_LABELS } from '@siba/shared';

export type { RubroTicket, PrioridadTicket, EstadoTicket, Ticket, TicketFormData };
export { RUBRO_LABELS, PRIORIDAD_LABELS, ESTADO_LABELS };

// Mantener extensiones específicas de UI si existen
export interface TicketHistorial extends SharedTicketHistorial {
  usuario?: {
    nombre: string;
    apellido: string;
  };
}

export interface OrdenTrabajo {
  id: number;
  numeroOT: number;
  fechaOT: string;
  ticketId: number;
  clienteId: number;
  sucursalId: number;
  tecnicoId: number;
  descripcionTrabajo: string;
  materialesUsados: string | null;
  firmaResponsable: string | null;
  aclaracionResponsable: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export const ESTADO_COLORS: Record<EstadoTicket, string> = {
  NUEVO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PROGRAMADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EN_CURSO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FINALIZADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RECHAZADO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELADO: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500',
};

export const PRIORIDAD_COLORS: Record<PrioridadTicket, string> = {
  PROGRAMADO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  URGENCIA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EMERGENCIA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  BAJA: 'bg-slate-100 text-slate-500',
  MEDIA: 'bg-blue-100 text-blue-600',
  ALTA: 'bg-orange-100 text-orange-600',
};
