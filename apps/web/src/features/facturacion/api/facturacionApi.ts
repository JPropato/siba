import api from '@/lib/api';
import type {
  FacturaEmitida,
  FacturaEmitidaFilters,
  PaginatedResponse,
  CreateFacturaEmitidaDto,
  RegistrarCobroDto,
} from '../types';

const BASE_URL = '/facturacion';

function buildParams(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const facturacionApi = {
  // === FACTURAS EMITIDAS ===
  getFacturasEmitidas: async (
    filters: FacturaEmitidaFilters = {}
  ): Promise<PaginatedResponse<FacturaEmitida>> => {
    const response = await api.get(`${BASE_URL}/facturas${buildParams(filters)}`);
    return response.data;
  },

  getFacturaEmitidaById: async (id: number): Promise<FacturaEmitida> => {
    const response = await api.get(`${BASE_URL}/facturas/${id}`);
    return response.data;
  },

  createFacturaEmitida: async (data: CreateFacturaEmitidaDto): Promise<FacturaEmitida> => {
    const response = await api.post(`${BASE_URL}/facturas`, data);
    return response.data;
  },

  updateFacturaEmitida: async (
    id: number,
    data: Partial<CreateFacturaEmitidaDto>
  ): Promise<FacturaEmitida> => {
    const response = await api.put(`${BASE_URL}/facturas/${id}`, data);
    return response.data;
  },

  anularFacturaEmitida: async (id: number): Promise<FacturaEmitida> => {
    const response = await api.post(`${BASE_URL}/facturas/${id}/anular`);
    return response.data;
  },

  registrarCobro: async (
    facturaId: number,
    data: Omit<RegistrarCobroDto, 'facturaId'>
  ): Promise<unknown> => {
    const response = await api.post(`${BASE_URL}/facturas/${facturaId}/cobros`, data);
    return response.data;
  },
};

export default facturacionApi;
