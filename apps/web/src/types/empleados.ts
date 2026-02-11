export type TipoEmpleado = 'TECNICO' | 'ADMINISTRATIVO' | 'GERENTE';
export type EstadoEmpleado = 'ACTIVO' | 'RENUNCIA' | 'BAJA' | 'LICENCIA';
export type TipoContrato = 'RELACION_DEPENDENCIA' | 'MONOTRIBUTO' | 'PASANTIA';
export type CategoriaLaboral =
  | 'OFICIAL'
  | 'MEDIO_OFICIAL'
  | 'AYUDANTE'
  | 'ADMINISTRATIVO'
  | 'ENCARGADO';
export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'UNION_CONVIVENCIAL';
export type EstadoPreocupacional = 'PENDIENTE' | 'APTO' | 'NO_APTO' | 'VENCIDO';
export type EstadoSeguroAP = 'PEDIDO_ALTA' | 'ACTIVO' | 'PEDIDO_BAJA' | 'BAJA';

// --- Config objects para badges/labels ---

export const ESTADO_EMPLEADO_CONFIG: Record<EstadoEmpleado, { label: string; color: string }> = {
  ACTIVO: { label: 'Activo', color: 'green' },
  RENUNCIA: { label: 'Renuncia', color: 'amber' },
  BAJA: { label: 'Baja', color: 'red' },
  LICENCIA: { label: 'Licencia', color: 'blue' },
};

export const TIPO_CONTRATO_CONFIG: Record<TipoContrato, { label: string }> = {
  RELACION_DEPENDENCIA: { label: 'Rel. dependencia' },
  MONOTRIBUTO: { label: 'Monotributo' },
  PASANTIA: { label: 'Pasantía' },
};

export const CATEGORIA_LABORAL_CONFIG: Record<CategoriaLaboral, { label: string }> = {
  OFICIAL: { label: 'Oficial' },
  MEDIO_OFICIAL: { label: 'Medio oficial' },
  AYUDANTE: { label: 'Ayudante' },
  ADMINISTRATIVO: { label: 'Administrativo' },
  ENCARGADO: { label: 'Encargado' },
};

export const ESTADO_CIVIL_LABELS: Record<EstadoCivil, string> = {
  SOLTERO: 'Soltero/a',
  CASADO: 'Casado/a',
  DIVORCIADO: 'Divorciado/a',
  VIUDO: 'Viudo/a',
  UNION_CONVIVENCIAL: 'Unión convivencial',
};

export const ESTADO_PREOCUPACIONAL_CONFIG: Record<
  EstadoPreocupacional,
  { label: string; color: string }
> = {
  PENDIENTE: { label: 'Pendiente', color: 'amber' },
  APTO: { label: 'Apto', color: 'green' },
  NO_APTO: { label: 'No apto', color: 'red' },
  VENCIDO: { label: 'Vencido', color: 'red' },
};

export const ESTADO_SEGURO_AP_CONFIG: Record<EstadoSeguroAP, { label: string; color: string }> = {
  PEDIDO_ALTA: { label: 'Pedido alta', color: 'blue' },
  ACTIVO: { label: 'Activo', color: 'green' },
  PEDIDO_BAJA: { label: 'Pedido baja', color: 'amber' },
  BAJA: { label: 'Baja', color: 'red' },
};

export const TIPO_EMPLEADO_CONFIG: Record<TipoEmpleado, { label: string }> = {
  TECNICO: { label: 'Técnico' },
  ADMINISTRATIVO: { label: 'Administrativo' },
  GERENTE: { label: 'Gerente' },
};

// --- Interfaces ---

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  direccion: string | null;
  telefono: string | null;
  inicioRelacionLaboral: string;
  tipo: TipoEmpleado;
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

  // Nuevos campos personales
  cuil: string | null;
  dni: string | null;
  fechaNacimiento: string | null;
  estadoCivil: EstadoCivil | null;
  cantidadHijos: number | null;
  telefonoSecundario: string | null;
  dniBeneficiario: string | null;

  // Nuevos campos laborales
  legajo: string | null;
  estado: EstadoEmpleado;
  tipoContrato: TipoContrato | null;
  categoriaLaboral: CategoriaLaboral | null;
  convenioSeccion: string | null;
  lugarTrabajo: string | null;
  horario: string | null;
  ieric: boolean;
  obraSocial: string | null;
  fechaBaja: string | null;
  motivoBaja: string | null;

  // Nuevos campos bancarios
  banco: string | null;
  cbu: string | null;
  estadoBanco: string | null;

  // Nuevos campos salariales (solo con permiso)
  sueldoBruto?: string | null;
  sueldoNeto?: string | null;
  fechaActualizacionSueldo?: string | null;

  // Documentacion
  preocupacionalEstado: EstadoPreocupacional | null;
  preocupacionalFecha: string | null;

  // Relaciones
  zona?: { nombre: string };
  usuario?: { email: string };
  segurosAP?: SeguroAP[];
  _count?: { segurosAP: number };
}

export interface EmpleadoFormData {
  nombre: string;
  apellido: string;
  email?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  inicioRelacionLaboral: string;
  tipo: TipoEmpleado;
  esReferente?: boolean;
  puesto?: string | null;
  foto?: string | null;
  notas?: string | null;
  fechaVencimientoSeguro?: string | null;
  fechaVencimientoRegistro?: string | null;
  zonaId?: number | null;
  usuarioId?: number | null;

  // Nuevos campos
  cuil?: string | null;
  dni?: string | null;
  fechaNacimiento?: string | null;
  estadoCivil?: EstadoCivil | null;
  cantidadHijos?: number | null;
  telefonoSecundario?: string | null;
  dniBeneficiario?: string | null;
  legajo?: string | null;
  estado?: EstadoEmpleado;
  tipoContrato?: TipoContrato | null;
  categoriaLaboral?: CategoriaLaboral | null;
  convenioSeccion?: string | null;
  lugarTrabajo?: string | null;
  horario?: string | null;
  ieric?: boolean;
  obraSocial?: string | null;
  fechaBaja?: string | null;
  motivoBaja?: string | null;
  banco?: string | null;
  cbu?: string | null;
  estadoBanco?: string | null;
  sueldoBruto?: string | number | null;
  sueldoNeto?: string | number | null;
  fechaActualizacionSueldo?: string | null;
  preocupacionalEstado?: EstadoPreocupacional | null;
  preocupacionalFecha?: string | null;
}

// --- Seguros AP ---

export interface SeguroAP {
  id: number;
  empleadoId: number;
  estado: EstadoSeguroAP;
  fechaSolicitudAlta: string;
  fechaAltaEfectiva: string | null;
  fechaSolicitudBaja: string | null;
  fechaBajaEfectiva: string | null;
  destino: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  empleado?: {
    id: number;
    nombre: string;
    apellido: string;
    legajo: string | null;
    cuil: string | null;
    estado: EstadoEmpleado;
  };
}

export interface SeguroAPFormData {
  empleadoId: number;
  destino?: string | null;
  observaciones?: string | null;
}

export interface ResumenSegurosAP {
  activos: number;
  pendientesAlta: number;
  pendientesBaja: number;
  sinCobertura: number;
  totalEmpleadosActivos: number;
}
