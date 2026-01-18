export type RubroTicket = 'CIVIL' | 'ELECTRICIDAD' | 'SANITARIOS' | 'VARIOS';
export type PrioridadTicket = 'PROGRAMADO' | 'EMERGENCIA' | 'URGENCIA';
export type EstadoTicket = 'NUEVO' | 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO';

export interface Ticket {
  id: number;
  codigoInterno: number;
  codigoCliente: string | null;
  descripcion: string;
  trabajo: string | null;
  observaciones: string | null;
  rubro: RubroTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  fechaCreacion: string;
  fechaProgramada: string | null;
  fechaFinalizacion: string | null;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
  sucursalId: number;
  tecnicoId: number | null;
  creadoPorId: number;
  actualizadoPorId: number | null;
  ticketRelacionadoId: number | null;

  // Relaciones
  sucursal?: {
    id?: number;
    nombre: string;
    direccion?: string;
    cliente?: {
      id?: number;
      razonSocial: string;
    };
  };
  tecnico?: {
    id?: number;
    nombre: string;
    apellido: string;
  };
  creadoPor?: {
    id?: number;
    nombre: string;
    apellido: string;
  };
  actualizadoPor?: {
    id?: number;
    nombre: string;
    apellido: string;
  };
  ticketRelacionado?: {
    id: number;
    codigoInterno: number;
    descripcion: string;
  };
  historial?: TicketHistorial[];
  ordenTrabajo?: OrdenTrabajo;
}

export interface TicketFormData {
  codigoCliente?: string | null;
  descripcion: string;
  trabajo?: string | null;
  observaciones?: string | null;
  rubro: RubroTicket;
  prioridad: PrioridadTicket;
  estado?: EstadoTicket;
  fechaProgramada?: string | null;
  sucursalId: number;
  tecnicoId?: number | null;
  ticketRelacionadoId?: number | null;
}

export interface TicketHistorial {
  id: number;
  ticketId: number;
  usuarioId: number;
  fechaCambio: string;
  campoModificado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  observacion: string | null;
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

// Labels para UI
export const RUBRO_LABELS: Record<RubroTicket, string> = {
  CIVIL: 'Civil',
  ELECTRICIDAD: 'Electricidad',
  SANITARIOS: 'Sanitarios',
  VARIOS: 'Varios',
};

export const PRIORIDAD_LABELS: Record<PrioridadTicket, string> = {
  PROGRAMADO: 'Programado',
  EMERGENCIA: 'Emergencia',
  URGENCIA: 'Urgencia',
};

export const ESTADO_LABELS: Record<EstadoTicket, string> = {
  NUEVO: 'Nuevo',
  PROGRAMADO: 'Programado',
  EN_CURSO: 'En Curso',
  FINALIZADO: 'Finalizado',
};

export const ESTADO_COLORS: Record<EstadoTicket, string> = {
  NUEVO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PROGRAMADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EN_CURSO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FINALIZADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export const PRIORIDAD_COLORS: Record<PrioridadTicket, string> = {
  PROGRAMADO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  URGENCIA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EMERGENCIA: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
