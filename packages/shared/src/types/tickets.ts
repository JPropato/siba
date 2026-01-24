export type RubroTicket =
  | 'CIVIL'
  | 'ELECTRICIDAD'
  | 'SANITARIOS'
  | 'VARIOS'
  | 'REFRIGERACION'
  | 'LIMPIEZA'
  | 'TERMINACIONES';
export type PrioridadTicket = 'PROGRAMADO' | 'EMERGENCIA' | 'URGENCIA' | 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoTicket =
  | 'NUEVO'
  | 'PROGRAMADO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'RECHAZADO'
  | 'CANCELADO';

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

  // Relaciones opcionales
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

export interface TicketFormData {
  descripcion: string;
  rubro: RubroTicket;
  prioridad: PrioridadTicket;
  sucursalId: number;
  tecnicoId?: number | null;
  ticketRelacionadoId?: number | null;
}

// Constantes compartidas para UI
export const RUBRO_LABELS: Record<RubroTicket, string> = {
  CIVIL: 'Civil',
  ELECTRICIDAD: 'Electricidad',
  SANITARIOS: 'Sanitarios',
  VARIOS: 'Varios',
  REFRIGERACION: 'Refrigeración',
  LIMPIEZA: 'Limpieza',
  TERMINACIONES: 'Terminaciones',
};

export const PRIORIDAD_LABELS: Record<PrioridadTicket, string> = {
  PROGRAMADO: 'Programado',
  EMERGENCIA: 'Emergencia',
  URGENCIA: 'Urgencia',
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const ESTADO_LABELS: Record<EstadoTicket, string> = {
  NUEVO: 'Nuevo',
  PROGRAMADO: 'Programado',
  EN_CURSO: 'En Curso',
  FINALIZADO: 'Finalizado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
};
