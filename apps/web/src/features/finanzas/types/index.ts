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
  | 'ECHEQ'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'MERCADOPAGO';

export type TipoCuentaContable = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';

export type EstadoMovimiento = 'PENDIENTE' | 'CONFIRMADO' | 'CONCILIADO' | 'ANULADO';

export interface CuentaContable {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoCuentaContable;
  nivel: number;
  parentId: number | null;
  imputable: boolean;
  activa: boolean;
  descripcion: string | null;
  parent?: { id: number; codigo: string; nombre: string } | null;
}

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  parentId: number | null;
  activo: boolean;
  descripcion: string | null;
  parent?: { id: number; codigo: string; nombre: string } | null;
}

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
  medioPago: MedioPago;
  monto: number;
  moneda: string;
  descripcion: string;
  comprobante?: string | null;
  comprobanteUrl?: string | null;
  fechaMovimiento: string;
  fechaRegistro: string;
  cuentaId: number;
  cuentaContableId?: number | null;
  centroCostoId?: number | null;
  clienteId?: number | null;
  ticketId?: number | null;
  obraId?: number | null;
  empleadoId?: number | null;
  estado: EstadoMovimiento;
  registradoPorId: number;
  transferenciaRef?: string | null;
  importacionId?: number | null;
  fechaActualizacion: string;
  // Relations
  cuenta?: { id: number; nombre: string };
  cuentaContable?: { id: number; codigo: string; nombre: string } | null;
  centroCosto?: { id: number; codigo: string; nombre: string } | null;
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
  cuentaContableId?: number;
  centroCostoId?: number;
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

export interface CreateTransferenciaDto {
  cuentaOrigenId: number;
  cuentaDestinoId: number;
  monto: number;
  descripcion: string;
  fechaMovimiento: string;
  comprobante?: string | null;
}

// Balance Contable
export interface CuentaConSaldo {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  imputable: boolean;
  saldo: number;
  hijos?: CuentaConSaldo[];
}

export interface GrupoContable {
  total: number;
  cuentas: CuentaConSaldo[];
}

export interface BalanceContable {
  fecha: string;
  activo: GrupoContable;
  pasivo: GrupoContable;
  patrimonio: GrupoContable;
  ingresos: GrupoContable;
  gastos: GrupoContable;
  resultadoPeriodo: number;
  ecuacionContable: {
    activo: number;
    pasivoPlusPatrimonio: number;
    balanceado: boolean;
  };
}

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

export const TIPO_CUENTA_CONTABLE_CONFIG: Record<
  TipoCuentaContable,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVO: { label: 'Activo', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PASIVO: { label: 'Pasivo', color: 'text-red-600', bgColor: 'bg-red-100' },
  PATRIMONIO: { label: 'Patrimonio', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  INGRESO: { label: 'Ingreso', color: 'text-green-600', bgColor: 'bg-green-100' },
  GASTO: { label: 'Gasto', color: 'text-amber-600', bgColor: 'bg-amber-100' },
};

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  ECHEQ: 'E-Cheq',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  MERCADOPAGO: 'Mercado Pago',
};

export const MEDIO_PAGO_POR_DEFECTO: Record<TipoCuenta, MedioPago> = {
  CAJA_CHICA: 'EFECTIVO',
  CUENTA_CORRIENTE: 'TRANSFERENCIA',
  CAJA_AHORRO: 'TRANSFERENCIA',
  BILLETERA_VIRTUAL: 'MERCADOPAGO',
  INVERSION: 'TRANSFERENCIA',
};
