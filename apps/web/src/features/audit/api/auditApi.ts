import api from '@/lib/api';

export interface EventoAuditoria {
  id: number;
  usuarioId: number;
  accion: string;
  modulo: string;
  entidadId: number | null;
  entidadTipo: string | null;
  descripcion: string;
  detalle: string | null;
  ip: string | null;
  obraId: number | null;
  ticketId: number | null;
  clienteId: number | null;
  fechaEvento: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface AuditFilters {
  page?: number;
  limit?: number;
  usuarioId?: number;
  modulo?: string;
  accion?: string;
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  obraId?: number;
  ticketId?: number;
  clienteId?: number;
}

export interface AuditListResponse {
  data: EventoAuditoria[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  getEventos: async (filters: AuditFilters = {}): Promise<AuditListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.usuarioId) params.append('usuarioId', String(filters.usuarioId));
    if (filters.modulo) params.append('modulo', filters.modulo);
    if (filters.accion) params.append('accion', filters.accion);
    if (filters.search) params.append('search', filters.search);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters.obraId) params.append('obraId', String(filters.obraId));
    if (filters.ticketId) params.append('ticketId', String(filters.ticketId));
    if (filters.clienteId) params.append('clienteId', String(filters.clienteId));

    const response = await api.get(`/audit?${params.toString()}`);
    return response.data;
  },

  getModulos: async (): Promise<string[]> => {
    const response = await api.get('/audit/modulos');
    return response.data;
  },

  getAcciones: async (): Promise<string[]> => {
    const response = await api.get('/audit/acciones');
    return response.data;
  },
};
