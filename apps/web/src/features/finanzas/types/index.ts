// Finanzas Types

export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export type TipoCuenta =
  | 'CAJA_CHICA'
  | 'CUENTA_CORRIENTE'
  | 'CAJA_AHORRO'
  | 'BILLETERA_VIRTUAL'
  | 'INVERSION';

export type MedioPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'MERCADOPAGO';

export type CategoriaIngreso =
  | 'COBRO_FACTURA'
  | 'ANTICIPO_CLIENTE'
  | 'REINTEGRO'
  | 'RENDIMIENTO_INVERSION'
  | 'RESCATE_INVERSION'
  | 'OTRO_INGRESO';

export type CategoriaEgreso =
  | 'MATERIALES'
  | 'MANO_DE_OBRA'
  | 'COMBUSTIBLE'
  | 'HERRAMIENTAS'
  | 'VIATICOS'
  | 'SUBCONTRATISTA'
  | 'IMPUESTOS'
  | 'SERVICIOS'
  | 'TRASPASO_INVERSION'
  | 'OTRO_EGRESO';

export type EstadoMovimiento = 'PENDIENTE' | 'CONFIRMADO' | 'CONCILIADO' | 'ANULADO';

export interface Banco {
  id: number;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  logo?: string | null;
  activo: boolean;
}

export interface CuentaFinanciera {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  bancoId?: number | null;
  numeroCuenta?: string | null;
  cbu?: string | null;
  alias?: string | null;
  saldoInicial: number;
  saldoActual: number;
  moneda: string;
  activa: boolean;
  tipoInversion?: string | null;
  tasaAnual?: number | null;
  fechaVencimiento?: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  banco?: Banco | null;
}

export interface Movimiento {
  id: number;
  codigo: string;
  tipo: TipoMovimiento;
  categoriaIngreso?: CategoriaIngreso | null;
  categoriaEgreso?: CategoriaEgreso | null;
  medioPago: MedioPago;
  monto: number;
  moneda: string;
  descripcion: string;
  comprobante?: string | null;
  fechaMovimiento: string;
  fechaRegistro: string;
  cuentaId: number;
  clienteId?: number | null;
  ticketId?: number | null;
  obraId?: number | null;
  empleadoId?: number | null;
  estado: EstadoMovimiento;
  registradoPorId: number;
  importacionId?: number | null;
  fechaActualizacion: string;
  // Relations
  cuenta?: { id: number; nombre: string };
  cliente?: { id: number; razonSocial: string };
  obra?: { id: number; codigo: string; titulo: string };
  ticket?: { id: number; codigoInterno: number };
  registradoPor?: { id: number; nombre: string; apellido: string };
}

export interface DashboardFinanzas {
  saldoTotal: number;
  ingresosMes: {
    monto: number;
    cantidad: number;
  };
  egresosMes: {
    monto: number;
    cantidad: number;
  };
  balanceMes: number;
  cuentas: Array<{
    id: number;
    nombre: string;
    tipo: TipoCuenta;
    banco?: string;
    saldoActual: number;
  }>;
  ultimosMovimientos: Movimiento[];
}

export interface MovimientoFilters {
  cuentaId?: number;
  tipo?: TipoMovimiento;
  estado?: EstadoMovimiento;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MovimientosListResponse {
  data: Movimiento[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CreateCuentaDto = Omit<
  CuentaFinanciera,
  'id' | 'saldoActual' | 'fechaCreacion' | 'fechaActualizacion' | 'banco' | 'activa'
> & { activa?: boolean };
export type UpdateCuentaDto = Partial<CreateCuentaDto>;

export type CreateMovimientoDto = Omit<
  Movimiento,
  | 'id'
  | 'codigo'
  | 'fechaRegistro'
  | 'estado'
  | 'registradoPorId'
  | 'fechaActualizacion'
  | 'cuenta'
  | 'cliente'
  | 'obra'
  | 'ticket'
  | 'registradoPor'
  | 'moneda'
> & { moneda?: string };
export type UpdateMovimientoDto = Partial<CreateMovimientoDto>;

// Configs para UI
export const TIPO_CUENTA_CONFIG: Record<TipoCuenta, { label: string; icon: string }> = {
  CAJA_CHICA: { label: 'Caja Chica', icon: 'Wallet' },
  CUENTA_CORRIENTE: { label: 'Cuenta Corriente', icon: 'Building2' },
  CAJA_AHORRO: { label: 'Caja de Ahorro', icon: 'PiggyBank' },
  BILLETERA_VIRTUAL: { label: 'Billetera Virtual', icon: 'Smartphone' },
  INVERSION: { label: 'Inversión', icon: 'TrendingUp' },
};

export const ESTADO_MOVIMIENTO_CONFIG: Record<
  EstadoMovimiento,
  { label: string; color: string; bgColor: string }
> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  CONFIRMADO: { label: 'Confirmado', color: 'text-green-600', bgColor: 'bg-green-100' },
  CONCILIADO: { label: 'Conciliado', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ANULADO: { label: 'Anulado', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const CATEGORIA_INGRESO_LABELS: Record<CategoriaIngreso, string> = {
  COBRO_FACTURA: 'Cobro de Factura',
  ANTICIPO_CLIENTE: 'Anticipo de Cliente',
  REINTEGRO: 'Reintegro',
  RENDIMIENTO_INVERSION: 'Rendimiento Inversión',
  RESCATE_INVERSION: 'Rescate Inversión',
  OTRO_INGRESO: 'Otro Ingreso',
};

export const CATEGORIA_EGRESO_LABELS: Record<CategoriaEgreso, string> = {
  MATERIALES: 'Materiales',
  MANO_DE_OBRA: 'Mano de Obra',
  COMBUSTIBLE: 'Combustible',
  HERRAMIENTAS: 'Herramientas',
  VIATICOS: 'Viáticos',
  SUBCONTRATISTA: 'Subcontratista',
  IMPUESTOS: 'Impuestos',
  SERVICIOS: 'Servicios',
  TRASPASO_INVERSION: 'Traspaso a Inversión',
  OTRO_EGRESO: 'Otro Egreso',
};

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  MERCADOPAGO: 'Mercado Pago',
};
