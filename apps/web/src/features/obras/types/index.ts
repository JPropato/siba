// Obras Types

export type TipoObra = 'OBRA_MAYOR' | 'SERVICIO_MENOR';

export type EstadoObra =
  | 'BORRADOR'
  | 'PRESUPUESTADO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'EN_EJECUCION'
  | 'FINALIZADO'
  | 'FACTURADO';

export type ModoEjecucion = 'CON_PRESUPUESTO' | 'EJECUCION_DIRECTA';

export type TipoItemPresupuesto = 'MATERIAL' | 'MANO_DE_OBRA' | 'TERCERO' | 'OTRO';

export interface Cliente {
  id: number;
  codigo: number;
  razonSocial: string;
}

export interface Sucursal {
  id: number;
  codigoInterno: number;
  nombre: string;
  direccion?: string;
}

export interface Ticket {
  id: number;
  codigoInterno: number;
  descripcion?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
}

export interface Material {
  id: number;
  codigoArticulo: string;
  nombre: string;
  descripcion?: string;
  presentacion: string;
  unidadMedida: string;
  categoria?: string | null;
  precioCosto: number;
  precioVenta: number;
  fechaActualizacion: string;
}

export interface ItemPresupuesto {
  id: number;
  versionId: number;
  tipo: TipoItemPresupuesto;
  orden: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  precioUnitario: number;
  subtotal: number;
  materialId?: number | null;
  material?: Material | null;
}

export interface VersionPresupuesto {
  id: number;
  obraId: number;
  version: number;
  esVigente: boolean;
  subtotal: number;
  total: number;
  notas?: string | null;
  archivoPdfId?: number | null;
  fechaCreacion: string;
  items: ItemPresupuesto[];
}

export interface ArchivoObra {
  id: number;
  obraId: number;
  tipoArchivo: string;
  nombreOriginal: string;
  nombreStorage: string;
  mimeType: string;
  tamanio: number;
  url?: string | null;
  fechaCreacion: string;
}

export interface Obra {
  id: number;
  codigo: string;
  tipo: TipoObra;
  modoEjecucion: ModoEjecucion;
  estado: EstadoObra;
  titulo: string;
  descripcion?: string | null;
  fechaSolicitud: string;
  fechaInicioEstimada?: string | null;
  fechaFinEstimada?: string | null;
  fechaInicioReal?: string | null;
  fechaFinReal?: string | null;
  clienteId: number;
  sucursalId?: number | null;
  ticketId?: number | null;
  montoPresupuestado: number;
  montoGastado: number;
  condicionesPago?: string | null;
  validezDias?: number | null;
  numeroFactura?: string | null;
  fechaFacturacion?: string | null;
  creadoPorId: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  // Relations
  cliente?: Cliente;
  sucursal?: Sucursal | null;
  ticket?: Ticket | null;
  creadoPor?: Usuario;
  versiones?: VersionPresupuesto[];
  archivos?: ArchivoObra[];
}

export interface CreateObraDto {
  tipo: TipoObra;
  modoEjecucion?: ModoEjecucion;
  titulo: string;
  descripcion?: string | null;
  fechaSolicitud: string;
  fechaInicioEstimada?: string | null;
  fechaFinEstimada?: string | null;
  clienteId: number;
  sucursalId?: number | null;
  ticketId?: number | null;
  condicionesPago?: string | null;
  validezDias?: number;
}

export interface UpdateObraDto extends Partial<CreateObraDto> {
  fechaInicioReal?: string | null;
  fechaFinReal?: string | null;
  numeroFactura?: string | null;
  fechaFacturacion?: string | null;
}

export interface ObraListResponse {
  data: Obra[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ObraFilters {
  search?: string;
  estado?: EstadoObra;
  tipo?: TipoObra;
  clienteId?: number;
  page?: number;
  limit?: number;
}

// Estado badges config
export const ESTADO_OBRA_CONFIG: Record<
  EstadoObra,
  { label: string; color: string; bgColor: string }
> = {
  BORRADOR: { label: 'Borrador', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  PRESUPUESTADO: { label: 'Presupuestado', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  APROBADO: { label: 'Aprobado', color: 'text-green-600', bgColor: 'bg-green-100' },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-600', bgColor: 'bg-red-100' },
  EN_EJECUCION: { label: 'En Ejecución', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  FINALIZADO: { label: 'Finalizado', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  FACTURADO: { label: 'Facturado', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

export const TIPO_OBRA_CONFIG: Record<TipoObra, { label: string; icon: string }> = {
  OBRA_MAYOR: { label: 'Obra Mayor', icon: 'Building2' },
  SERVICIO_MENOR: { label: 'Servicio Menor', icon: 'Wrench' },
};

export const MODO_EJECUCION_CONFIG: Record<ModoEjecucion, { label: string }> = {
  CON_PRESUPUESTO: { label: 'Con Presupuesto' },
  EJECUCION_DIRECTA: { label: 'Ejecución Directa' },
};

export const TIPO_ITEM_CONFIG: Record<TipoItemPresupuesto, { label: string; icon: string }> = {
  MATERIAL: { label: 'Material', icon: 'Package' },
  MANO_DE_OBRA: { label: 'Mano de Obra', icon: 'Users' },
  TERCERO: { label: 'Tercero', icon: 'Building' },
  OTRO: { label: 'Otro', icon: 'MoreHorizontal' },
};

export const UNIDADES_COMUNES = ['u', 'hs', 'm', 'm2', 'ml', 'kg', 'lt', 'gl'];

export interface CreateItemDto {
  tipo: TipoItemPresupuesto;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  precioUnitario: number;
  materialId?: number | null;
  orden?: number;
}

export type UpdateItemDto = Partial<CreateItemDto>;

export interface ComentarioObra {
  id: number;
  obraId: number;
  usuarioId: number;
  contenido: string;
  fechaCreacion: string;
  usuario?: Usuario;
}

export interface HistorialEstadoObra {
  id: number;
  obraId: number;
  estadoAnterior: EstadoObra;
  estadoNuevo: EstadoObra;
  usuarioId: number;
  fechaCambio: string;
  observacion?: string | null;
  usuario?: Usuario;
}
