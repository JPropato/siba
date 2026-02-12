// Compras Types

export type CondicionIva =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'NO_RESPONSABLE'
  | 'CONSUMIDOR_FINAL';

export type TipoComprobante =
  | 'FACTURA_A'
  | 'FACTURA_B'
  | 'FACTURA_C'
  | 'NOTA_CREDITO_A'
  | 'NOTA_CREDITO_B'
  | 'NOTA_CREDITO_C'
  | 'NOTA_DEBITO_A'
  | 'NOTA_DEBITO_B'
  | 'NOTA_DEBITO_C'
  | 'RECIBO'
  | 'TICKET'
  | 'OTRO';

export type EstadoFacturaProveedor = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';

export type TipoCheque = 'FISICO' | 'ECHEQ';

export type EstadoCheque =
  | 'CARTERA'
  | 'DEPOSITADO'
  | 'COBRADO'
  | 'ENDOSADO'
  | 'VENDIDO'
  | 'RECHAZADO'
  | 'ANULADO';

export interface Proveedor {
  id: number;
  codigo: number;
  razonSocial: string;
  cuit: string;
  condicionIva: CondicionIva;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  notas: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
  // Summary from getById
  _count?: { facturas: number };
  _totalPendiente?: number;
}

export interface FacturaProveedor {
  id: number;
  proveedorId: number;
  tipoComprobante: TipoComprobante;
  puntoVenta: number;
  numeroComprobante: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  subtotal: number;
  montoIva21: number;
  montoIva105: number;
  montoIva27: number;
  montoExento: number;
  montoNoGravado: number;
  percepcionIIBB: number;
  percepcionIva: number;
  otrosImpuestos: number;
  total: number;
  retencionGanancias: number;
  retencionIva: number;
  retencionIIBB: number;
  retencionSUSS: number;
  totalAPagar: number;
  montoPagado: number;
  saldoPendiente: number;
  estado: EstadoFacturaProveedor;
  cuentaContableId: number | null;
  centroCostoId: number | null;
  obraId: number | null;
  archivoPdf: string | null;
  descripcion: string | null;
  registradoPorId: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  // Relations
  proveedor?: { id: number; razonSocial: string; cuit: string };
  cuentaContable?: { id: number; codigo: string; nombre: string } | null;
  centroCosto?: { id: number; codigo: string; nombre: string } | null;
  obra?: { id: number; codigo: string; titulo: string } | null;
  registradoPor?: { id: number; nombre: string; apellido: string };
  pagos?: PagoFactura[];
}

export interface PagoFactura {
  id: number;
  facturaId: number;
  monto: number;
  fechaPago: string;
  medioPago: string;
  movimientoId: number | null;
  chequeId: number | null;
  comprobantePago: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  movimiento?: { id: number; codigo: string; estado: string } | null;
  cheque?: { id: number; numero: string; tipo: TipoCheque } | null;
}

export interface Cheque {
  id: number;
  numero: string;
  tipo: TipoCheque;
  bancoEmisor: string;
  fechaEmision: string;
  fechaCobro: string;
  monto: number;
  beneficiario: string | null;
  emisor: string | null;
  estado: EstadoCheque;
  cuentaDestinoId: number | null;
  fechaDeposito: string | null;
  fechaAcreditacion: string | null;
  endosadoA: string | null;
  fechaEndoso: string | null;
  ventaLoteId: string | null;
  ventaEntidad: string | null;
  ventaTasaDescuento: number | null;
  ventaIvaComision: number | null;
  ventaComisionBruta: number | null;
  ventaMontoNeto: number | null;
  ventaMovimientoId: number | null;
  motivoRechazo: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  cuentaDestino?: { id: number; nombre: string } | null;
}

// Filters
export interface ProveedorFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface FacturaFilters {
  proveedorId?: number;
  estado?: EstadoFacturaProveedor;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChequeFilters {
  tipo?: TipoCheque;
  estado?: EstadoCheque;
  fechaCobroDesde?: string;
  fechaCobroHasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// DTOs
export type CreateProveedorDto = {
  razonSocial: string;
  cuit: string;
  condicionIva: CondicionIva;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  notas?: string | null;
};

export type UpdateProveedorDto = Partial<CreateProveedorDto>;

export type CreateFacturaDto = {
  proveedorId: number;
  tipoComprobante: TipoComprobante;
  puntoVenta: number;
  numeroComprobante: string;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  subtotal: number;
  montoIva21?: number;
  montoIva105?: number;
  montoIva27?: number;
  montoExento?: number;
  montoNoGravado?: number;
  percepcionIIBB?: number;
  percepcionIva?: number;
  otrosImpuestos?: number;
  total: number;
  retencionGanancias?: number;
  retencionIva?: number;
  retencionIIBB?: number;
  retencionSUSS?: number;
  cuentaContableId?: number | null;
  centroCostoId?: number | null;
  obraId?: number | null;
  archivoPdf?: string | null;
  descripcion?: string | null;
};

export type RegistrarPagoDto = {
  facturaId: number;
  monto: number;
  fechaPago: string;
  medioPago: string;
  cuentaId: number;
  chequeId?: number | null;
  comprobantePago?: string | null;
  observaciones?: string | null;
};

export type CreateChequeDto = {
  numero: string;
  tipo: TipoCheque;
  bancoEmisor: string;
  fechaEmision: string;
  fechaCobro: string;
  monto: number;
  beneficiario?: string | null;
  emisor?: string | null;
  observaciones?: string | null;
};

// UI Config maps
export const CONDICION_IVA_LABELS: Record<CondicionIva, string> = {
  RESPONSABLE_INSCRIPTO: 'Resp. Inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Cons. Final',
};

export const TIPO_COMPROBANTE_LABELS: Record<TipoComprobante, string> = {
  FACTURA_A: 'FC-A',
  FACTURA_B: 'FC-B',
  FACTURA_C: 'FC-C',
  NOTA_CREDITO_A: 'NC-A',
  NOTA_CREDITO_B: 'NC-B',
  NOTA_CREDITO_C: 'NC-C',
  NOTA_DEBITO_A: 'ND-A',
  NOTA_DEBITO_B: 'ND-B',
  NOTA_DEBITO_C: 'ND-C',
  RECIBO: 'Recibo',
  TICKET: 'Ticket',
  OTRO: 'Otro',
};

export const ESTADO_FACTURA_CONFIG: Record<
  EstadoFacturaProveedor,
  { label: string; color: string; bgColor: string }
> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  PAGO_PARCIAL: { label: 'Pago Parcial', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PAGADA: { label: 'Pagada', color: 'text-green-600', bgColor: 'bg-green-100' },
  ANULADA: { label: 'Anulada', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const ESTADO_CHEQUE_CONFIG: Record<
  EstadoCheque,
  { label: string; color: string; bgColor: string }
> = {
  CARTERA: { label: 'En Cartera', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  DEPOSITADO: { label: 'Depositado', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  COBRADO: { label: 'Cobrado', color: 'text-green-600', bgColor: 'bg-green-100' },
  ENDOSADO: { label: 'Endosado', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  VENDIDO: { label: 'Vendido', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-600', bgColor: 'bg-red-100' },
  ANULADO: { label: 'Anulado', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export const TIPO_CHEQUE_LABELS: Record<TipoCheque, string> = {
  FISICO: 'Fisico',
  ECHEQ: 'E-Cheq',
};
