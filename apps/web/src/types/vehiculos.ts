// --- Enums y configs ---

export type TipoMultaVehiculo = 'ARBA_PATENTE' | 'INFRACCION_CABA' | 'INFRACCION_PROVINCIA';
export type EstadoMultaVehiculo = 'PENDIENTE' | 'PAGADA' | 'EN_GESTION';
export type EstadoVehiculo = 'ACTIVO' | 'TALLER' | 'FUERA_SERVICIO';

export const TIPO_MULTA_CONFIG: Record<TipoMultaVehiculo, { label: string; color: string }> = {
  ARBA_PATENTE: { label: 'ARBA Patente', color: 'blue' },
  INFRACCION_CABA: { label: 'Infracción CABA', color: 'amber' },
  INFRACCION_PROVINCIA: { label: 'Infracción Provincia', color: 'orange' },
};

export const ESTADO_MULTA_CONFIG: Record<EstadoMultaVehiculo, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'amber' },
  PAGADA: { label: 'Pagada', color: 'green' },
  EN_GESTION: { label: 'En gestión', color: 'blue' },
};

export const ESTADO_VEHICULO_CONFIG: Record<EstadoVehiculo, { label: string; color: string }> = {
  ACTIVO: { label: 'Activo', color: 'green' },
  TALLER: { label: 'En Taller', color: 'amber' },
  FUERA_SERVICIO: { label: 'Fuera de Servicio', color: 'red' },
};

// --- Interfaces ---

export interface Vehiculo {
  id: number;
  codigoInterno: number;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  tipo: string | null;
  zonaId: number | null;
  kilometros: number | null;
  proximosKm: number | null;
  proximoService: string | null;
  fechaVencimientoVTV: string | null;
  fechaCambioAceite: string | null;
  tecnicoReferenteId: number | null;
  tecnicoId: number | null;
  conductorId: number | null;
  estado: EstadoVehiculo;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;

  // Relaciones
  zona?: { nombre: string };
  tecnicoReferente?: { id: number; nombre: string; apellido: string };
  tecnico?: { id: number; nombre: string; apellido: string };
  conductor?: {
    id: number;
    nombre: string;
    apellido: string;
    fechaVencimientoRegistro: string | null;
  };
  _count?: { multas: number };
}

export interface VehiculoFormData {
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipo?: string;
  zonaId?: number | null;
  kilometros?: number;
  proximosKm?: number | null;
  proximoService?: string | null;
  fechaVencimientoVTV?: string | null;
  fechaCambioAceite?: string | null;
  tecnicoReferenteId?: number | null;
  tecnicoId?: number | null;
  conductorId?: number | null;
  estado?: EstadoVehiculo;
}

export interface MultaVehiculo {
  id: number;
  vehiculoId: number;
  tipo: TipoMultaVehiculo;
  estado: EstadoMultaVehiculo;
  fecha: string;
  monto: number;
  numeroActa: string | null;
  descripcion: string | null;
  fechaPago: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  vehiculo?: { id: number; patente: string; marca: string | null; modelo: string | null };
}

export interface MultaVehiculoFormData {
  vehiculoId: number;
  tipo: TipoMultaVehiculo;
  fecha: string;
  monto: number;
  numeroActa?: string | null;
  descripcion?: string | null;
  observaciones?: string | null;
}

export interface ResumenVehiculos {
  totalActivos: number;
  enTaller: number;
  fueraServicio: number;
  vtvPorVencer: number;
  aceitePorCambiar: number;
  multasPendientes: number;
}
