export type TipoEmpleado = 'TECNICO' | 'ADMINISTRATIVO' | 'GERENTE';
export type TipoContratacion = 'CONTRATO_MARCO';

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  direccion: string | null;
  telefono: string | null;
  inicioRelacionLaboral: string;
  tipo: TipoEmpleado;
  contratacion: TipoContratacion | null;
  esReferente: boolean;
  puesto: string | null;
  foto: string | null;
  notas: string | null;
  fechaVencimientoSeguro: string | null;
  fechaVencimientoRegistro: string | null;
  zonaId: number | null;
  usuarioId: number | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;

  // Relaciones
  zona?: {
    nombre: string;
  };
  usuario?: {
    email: string;
  };
}

export interface EmpleadoFormData {
  nombre: string;
  apellido: string;
  email?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  inicioRelacionLaboral: string;
  tipo: TipoEmpleado;
  contratacion?: TipoContratacion | null;
  esReferente?: boolean;
  puesto?: string | null;
  foto?: string | null;
  notas?: string | null;
  fechaVencimientoSeguro?: string | null;
  fechaVencimientoRegistro?: string | null;
  zonaId?: number | null;
  usuarioId?: number | null;
}
