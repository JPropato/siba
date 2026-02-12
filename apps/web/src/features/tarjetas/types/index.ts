// ============ ENUMS ============

export type TipoTarjeta = 'PRECARGABLE' | 'CORPORATIVA';
export type TipoTarjetaFinanciera = 'CREDITO' | 'DEBITO' | 'PREPAGA';
export type RedProcesadora =
  | 'VISA'
  | 'MASTERCARD'
  | 'CABAL'
  | 'NARANJA'
  | 'AMERICAN_EXPRESS'
  | 'MAESTRO';
export type EstadoTarjeta = 'ACTIVA' | 'SUSPENDIDA' | 'BAJA';
export type CategoriaGastoTarjeta =
  | 'GAS'
  | 'FERRETERIA'
  | 'ESTACIONAMIENTO'
  | 'LAVADERO'
  | 'NAFTA'
  | 'REPUESTOS'
  | 'MATERIALES_ELECTRICOS'
  | 'PEAJES'
  | 'COMIDA'
  | 'HERRAMIENTAS'
  | 'OTRO';
export type EstadoRendicion = 'ABIERTA' | 'CERRADA' | 'APROBADA' | 'RECHAZADA';

export type CondicionIVA =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTISTA'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL';

export type TipoComprobante =
  | 'FACTURA_A'
  | 'FACTURA_B'
  | 'FACTURA_C'
  | 'FACTURA_E'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'RECIBO'
  | 'OTRO';

// ============ CONFIGS ============

export const TIPO_TARJETA_CONFIG: Record<TipoTarjeta, { label: string; color: string }> = {
  PRECARGABLE: {
    label: 'Precargable',
    color:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  CORPORATIVA: {
    label: 'Corporativa',
    color:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  },
};

export const ESTADO_TARJETA_CONFIG: Record<EstadoTarjeta, { label: string; color: string }> = {
  ACTIVA: {
    label: 'Activa',
    color:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  SUSPENDIDA: {
    label: 'Suspendida',
    color:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  BAJA: {
    label: 'Baja',
    color:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

export const TIPO_TARJETA_FINANCIERA_CONFIG: Record<TipoTarjetaFinanciera, { label: string }> = {
  CREDITO: { label: 'Crédito' },
  DEBITO: { label: 'Débito' },
  PREPAGA: { label: 'Prepaga' },
};

export const RED_PROCESADORA_CONFIG: Record<RedProcesadora, { label: string }> = {
  VISA: { label: 'Visa' },
  MASTERCARD: { label: 'Mastercard' },
  CABAL: { label: 'Cabal' },
  NARANJA: { label: 'Naranja' },
  AMERICAN_EXPRESS: { label: 'American Express' },
  MAESTRO: { label: 'Maestro' },
};

export const CATEGORIA_GASTO_CONFIG: Record<
  CategoriaGastoTarjeta,
  { label: string; icon: string }
> = {
  GAS: { label: 'Gas', icon: 'Flame' },
  FERRETERIA: { label: 'Ferretería', icon: 'Wrench' },
  ESTACIONAMIENTO: { label: 'Estacionamiento', icon: 'ParkingCircle' },
  LAVADERO: { label: 'Lavadero', icon: 'Droplets' },
  NAFTA: { label: 'Nafta', icon: 'Fuel' },
  REPUESTOS: { label: 'Repuestos', icon: 'Cog' },
  MATERIALES_ELECTRICOS: { label: 'Materiales Eléctricos', icon: 'Zap' },
  PEAJES: { label: 'Peajes', icon: 'Route' },
  COMIDA: { label: 'Comida', icon: 'UtensilsCrossed' },
  HERRAMIENTAS: { label: 'Herramientas', icon: 'Hammer' },
  OTRO: { label: 'Otro', icon: 'MoreHorizontal' },
};

export const ESTADO_RENDICION_CONFIG: Record<EstadoRendicion, { label: string; color: string }> = {
  ABIERTA: {
    label: 'Abierta',
    color:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  CERRADA: {
    label: 'Cerrada',
    color:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  APROBADA: {
    label: 'Aprobada',
    color:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  RECHAZADA: {
    label: 'Rechazada',
    color:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

export const CONDICION_IVA_CONFIG: Record<CondicionIVA, { label: string }> = {
  RESPONSABLE_INSCRIPTO: { label: 'Responsable Inscripto' },
  MONOTRIBUTISTA: { label: 'Monotributista' },
  EXENTO: { label: 'Exento' },
  CONSUMIDOR_FINAL: { label: 'Consumidor Final' },
};

export const TIPO_COMPROBANTE_CONFIG: Record<TipoComprobante, { label: string }> = {
  FACTURA_A: { label: 'Factura A' },
  FACTURA_B: { label: 'Factura B' },
  FACTURA_C: { label: 'Factura C' },
  FACTURA_E: { label: 'Factura E' },
  NOTA_CREDITO: { label: 'Nota de Crédito' },
  NOTA_DEBITO: { label: 'Nota de Débito' },
  RECIBO: { label: 'Recibo' },
  OTRO: { label: 'Otro' },
};

// ============ INTERFACES ============

export interface ConfigCategoriaGasto {
  id: number;
  categoria: CategoriaGastoTarjeta;
  label: string;
  cuentaContableId: number;
  cuentaContable: { id: number; codigo: string; nombre: string };
  activa: boolean;
}

export interface Proveedor {
  id: number;
  razonSocial: string;
  cuit: string;
  condicionIva?: CondicionIVA;
  vecesUsado?: number; // For proveedores-frecuentes endpoint
}

export interface ProveedorFormData {
  razonSocial: string;
  cuit: string;
  condicionIva: CondicionIVA;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface FacturaProveedor {
  id: number;
  tipoComprobante: TipoComprobante;
  puntoVenta: number;
  numeroComprobante: string;
}

export interface FacturaFormData {
  tipoComprobante: TipoComprobante;
  puntoVenta: number;
  numeroComprobante: string;
  fechaEmision: string;
}

export interface TarjetaPrecargable {
  id: number;
  tipo: TipoTarjeta;
  tipoTarjetaFinanciera: TipoTarjetaFinanciera | null;
  redProcesadora: RedProcesadora | null;
  estado: EstadoTarjeta;
  numeroTarjeta: string | null;
  alias: string | null;
  empleadoId: number;
  empleado: { id: number; nombre: string; apellido: string; esReferente?: boolean };
  cuentaFinancieraId: number;
  cuentaFinanciera: {
    id: number;
    nombre: string;
    saldoActual: number;
    tipo: string;
    moneda?: string;
  };
  bancoId: number | null;
  banco: { id: number; nombre?: string; nombreCorto: string } | null;
  fechaCreacion: string;
  _count?: { gastos: number; cargas: number; rendiciones?: number };
  // Detail fields
  cargas?: CargaTarjeta[];
  gastos?: GastoTarjeta[];
  rendiciones?: Rendicion[];
}

export interface TarjetaFormData {
  tipo: TipoTarjeta;
  tipoTarjetaFinanciera?: TipoTarjetaFinanciera;
  redProcesadora?: RedProcesadora;
  empleadoId: number;
  cuentaFinancieraId: number;
  numeroTarjeta?: string;
  alias?: string;
  bancoId?: number;
  estado?: EstadoTarjeta;
}

export interface CargaTarjeta {
  id: number;
  tarjetaId: number;
  monto: number;
  fecha: string;
  descripcion: string | null;
  comprobante: string | null;
  movimientoId: number;
  movimiento: { id: number; codigo: string; estado: string };
  registradoPor?: { id: number; nombre: string; apellido: string };
  fechaCreacion: string;
}

export interface CargaFormData {
  monto: number;
  fecha: string;
  descripcion?: string;
  comprobante?: string;
}

export interface GastoTarjeta {
  id: number;
  tarjetaId: number;
  categoria: CategoriaGastoTarjeta;
  categoriaOtro: string | null;
  monto: number;
  fecha: string;
  concepto: string;
  ticketId: number | null;
  ticket: { id: number; codigoInterno: number; descripcion?: string } | null;
  centroCostoId: number | null;
  centroCosto: { id: number; codigo: string; nombre: string } | null;
  proveedorId: number | null;
  proveedor: Proveedor | null;
  facturaProveedorId: number | null;
  facturaProveedor: FacturaProveedor | null;
  movimientoId: number;
  movimiento: {
    id: number;
    codigo: string;
    estado: string;
    cuentaContable?: { codigo: string; nombre: string };
  };
  registradoPor?: { id: number; nombre: string; apellido: string };
  archivos: { id: number; nombreOriginal: string; url: string | null; mimeType: string }[];
  fechaCreacion: string;
}

export interface GastoFormData {
  categoria: CategoriaGastoTarjeta;
  categoriaOtro?: string;
  monto: number;
  fecha: string;
  concepto: string;
  ticketId?: number | null;
  centroCostoId?: number | null;
  // Proveedor: either existing ID or new data
  proveedorId?: number;
  proveedor?: ProveedorFormData;
  // Factura data
  factura?: FacturaFormData;
}

export interface Rendicion {
  id: number;
  codigo: string;
  tarjetaId: number;
  tarjeta?: TarjetaPrecargable;
  estado: EstadoRendicion;
  fechaDesde: string;
  fechaHasta: string;
  totalGastos: number;
  cantidadGastos: number;
  observaciones: string | null;
  motivoRechazo: string | null;
  aprobadoPorId: number | null;
  aprobadoPor: { id: number; nombre: string; apellido: string } | null;
  fechaAprobacion: string | null;
  creadoPorId: number;
  creadoPor: { id: number; nombre: string; apellido: string };
  _count?: { gastos: number };
  gastos?: GastoTarjeta[];
  fechaCreacion: string;
}

export interface RendicionFormData {
  tarjetaId: number;
  fechaDesde: string;
  fechaHasta: string;
  observaciones?: string;
}

export interface ResumenTarjetas {
  total: number;
  precargables: number;
  corporativas: number;
  activas: number;
  saldoPrecargables: number;
  gastosMes: number;
  cantidadGastosMes: number;
  rendicionesPendientes: number;
}
