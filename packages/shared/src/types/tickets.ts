// ============ TIPOS ============

export type RubroTicket =
  | 'CIVIL'
  | 'ELECTRICIDAD'
  | 'SANITARIOS'
  | 'VARIOS'
  | 'REFRIGERACION'
  | 'LIMPIEZA'
  | 'TERMINACIONES';

// TipoTicket define el SLA del ticket (reemplaza PrioridadTicket)
export type TipoTicket = 'SEA' | 'SEP' | 'SN';

export type EstadoTicket =
  | 'NUEVO'
  | 'ASIGNADO'
  | 'EN_CURSO'
  | 'PENDIENTE_CLIENTE'
  | 'FINALIZADO'
  | 'CANCELADO';

// ============ INTERFACES ============

export interface Ticket {
  id: number;
  codigoInterno: number;
  codigoCliente: string | null;
  descripcion: string;
  trabajo: string | null;
  observaciones: string | null;
  rubro: RubroTicket;
  tipoTicket: TipoTicket;
  estado: EstadoTicket;
  fechaCreacion: string;
  fechaProgramada: string | null;
  horaEjecucion: string | null;
  fechaFinalizacion: string | null;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
  motivoRechazo: string | null;
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
  tipoTicket: TipoTicket;
  sucursalId: number;
  tecnicoId?: number | null;
  fechaProgramada?: string | null;
  horaEjecucion?: string | null;
  codigoCliente?: string | null;
  trabajo?: string | null;
  observaciones?: string | null;
  ticketRelacionadoId?: number | null;
}

// ============ CONSTANTES ============

export const RUBRO_LABELS: Record<RubroTicket, string> = {
  CIVIL: 'Civil',
  ELECTRICIDAD: 'Electricidad',
  SANITARIOS: 'Sanitarios',
  VARIOS: 'Varios',
  REFRIGERACION: 'Refrigeración',
  LIMPIEZA: 'Limpieza',
  TERMINACIONES: 'Terminaciones',
};

export const TIPO_TICKET_LABELS: Record<TipoTicket, string> = {
  SEA: 'Emergencia Alta',
  SEP: 'Emergencia Programable',
  SN: 'Normal',
};

export const TIPO_TICKET_SLA: Record<TipoTicket, string> = {
  SEA: 'Fin del día hábil siguiente',
  SEP: '7 días corridos',
  SN: '15 días corridos',
};

export const ESTADO_LABELS: Record<EstadoTicket, string> = {
  NUEVO: 'Nuevo',
  ASIGNADO: 'Asignado',
  EN_CURSO: 'En Curso',
  PENDIENTE_CLIENTE: 'Pendiente Cliente',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

// Transiciones válidas según flujo definido
export const TRANSICIONES_VALIDAS: Record<EstadoTicket, EstadoTicket[]> = {
  NUEVO: ['ASIGNADO', 'CANCELADO'],
  ASIGNADO: ['EN_CURSO', 'NUEVO', 'CANCELADO'],
  EN_CURSO: ['PENDIENTE_CLIENTE'],
  PENDIENTE_CLIENTE: ['FINALIZADO', 'NUEVO'],
  FINALIZADO: [],
  CANCELADO: [],
};

// Helper para verificar si una transición es válida
export const esTransicionValida = (
  estadoActual: EstadoTicket,
  estadoNuevo: EstadoTicket
): boolean => {
  return TRANSICIONES_VALIDAS[estadoActual].includes(estadoNuevo);
};
