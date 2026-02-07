// API types for Ordenes de Trabajo
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
  estado?: string;
  fechaCreacion: string;
  fechaActualizacion: string;

  // Relations
  ticket?: {
    id: number;
    codigoInterno: number;
    descripcion: string;
    estado?: string;
  };
  cliente?: {
    id: number;
    razonSocial: string;
  };
  sucursal?: {
    id: number;
    nombre: string;
  };
  tecnico?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  archivos?: Archivo[];
}

export interface Archivo {
  id: number;
  nombreOriginal: string;
  nombreStorage: string;
  mimeType: string;
  tamanio: number;
  bucket: string;
  url: string | null;
  ordenTrabajoId: number | null;
  ticketId: number | null;
  fechaCreacion: string;
}

export interface CreateOTPayload {
  ticketId: number;
  descripcionTrabajo: string;
  materialesUsados?: string | null;
  fechaOT?: string;
}

export interface UpdateOTPayload {
  descripcionTrabajo?: string;
  materialesUsados?: string | null;
  firmaResponsable?: string | null;
  aclaracionResponsable?: string | null;
}

export interface FinalizarOTPayload {
  firmaResponsable?: string;
  aclaracionResponsable?: string;
}
