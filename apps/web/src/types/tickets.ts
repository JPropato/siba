import type {
  RubroTicket,
  TipoTicket,
  EstadoTicket,
  Ticket,
  TicketFormData,
  TicketHistorial as SharedTicketHistorial,
} from '@siba/shared';
import {
  RUBRO_LABELS,
  TIPO_TICKET_LABELS,
  TIPO_TICKET_SLA,
  ESTADO_LABELS,
  TRANSICIONES_VALIDAS,
  esTransicionValida,
} from '@siba/shared';

export type { RubroTicket, TipoTicket, EstadoTicket, Ticket, TicketFormData };
export {
  RUBRO_LABELS,
  TIPO_TICKET_LABELS,
  TIPO_TICKET_SLA,
  ESTADO_LABELS,
  TRANSICIONES_VALIDAS,
  esTransicionValida,
};

// Mantener extensiones específicas de UI
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

// Colores para estados
export const ESTADO_COLORS: Record<EstadoTicket, string> = {
  NUEVO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ASIGNADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EN_CURSO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDIENTE_CLIENTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  FINALIZADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELADO: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500',
};

// Colores para tipos de ticket (SLA)
export const TIPO_TICKET_COLORS: Record<TipoTicket, string> = {
  SEA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SEP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SN: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
