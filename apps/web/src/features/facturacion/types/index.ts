// Facturacion Types
// Reuses TipoComprobante and related labels from compras/types

export type EstadoFacturaEmitida = 'PENDIENTE' | 'COBRO_PARCIAL' | 'COBRADA' | 'ANULADA';

export interface FacturaEmitida {
  id: number;
  clienteId: number;
  tipoComprobante: string;
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
  montoCobrado: number;
  saldoPendiente: number;
  estado: EstadoFacturaEmitida;
  cuentaContableId: number | null;
  centroCostoId: number | null;
  obraId: number | null;
  ticketId: number | null;
  cae: string | null;
  caeFechaVto: string | null;
  archivoPdf: string | null;
  descripcion: string | null;
  registradoPorId: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  // Relations
  cliente?: { id: number; razonSocial: string; cuit: string | null };
  cuentaContable?: { id: number; codigo: string; nombre: string } | null;
  centroCosto?: { id: number; codigo: string; nombre: string } | null;
  obra?: { id: number; codigo: string; titulo: string } | null;
  ticket?: { id: number; codigoInterno: number } | null;
  registradoPor?: { id: number; nombre: string; apellido: string };
  cobros?: CobroFactura[];
}

export interface CobroFactura {
  id: number;
  facturaId: number;
  monto: number;
  fechaCobro: string;
  medioPago: string;
  movimientoId: number | null;
  chequeId: number | null;
  comprobanteCobro: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  movimiento?: { id: number; codigo: string; estado: string } | null;
  cheque?: { id: number; numero: string; tipo: string } | null;
}

// Filters
export interface FacturaEmitidaFilters {
  clienteId?: number;
  estado?: EstadoFacturaEmitida;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Paginated response (same structure as compras)
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
export type CreateFacturaEmitidaDto = {
  clienteId: number;
  tipoComprobante: string;
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
  cuentaContableId?: number | null;
  centroCostoId?: number | null;
  obraId?: number | null;
  ticketId?: number | null;
  archivoPdf?: string | null;
  descripcion?: string | null;
};

export type RegistrarCobroDto = {
  facturaId: number;
  monto: number;
  fechaCobro: string;
  medioPago: string;
  cuentaId: number;
  chequeData?: {
    numero: string;
    tipo: 'FISICO' | 'ECHEQ';
    bancoEmisor: string;
    fechaEmision: string;
    fechaCobro: string;
    monto: number;
    emisor?: string | null;
  } | null;
  comprobanteCobro?: string | null;
  observaciones?: string | null;
};

// UI Config maps
export const ESTADO_FACTURA_EMITIDA_CONFIG: Record<
  EstadoFacturaEmitida,
  { label: string; color: string; bgColor: string }
> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  COBRO_PARCIAL: { label: 'Cobro Parcial', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  COBRADA: { label: 'Cobrada', color: 'text-green-600', bgColor: 'bg-green-100' },
  ANULADA: { label: 'Anulada', color: 'text-red-600', bgColor: 'bg-red-100' },
};
