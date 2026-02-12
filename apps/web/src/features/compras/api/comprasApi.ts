import api from '@/lib/api';
import type {
  Proveedor,
  FacturaProveedor,
  Cheque,
  ProveedorFilters,
  FacturaFilters,
  ChequeFilters,
  PaginatedResponse,
  CreateProveedorDto,
  UpdateProveedorDto,
  CreateFacturaDto,
  RegistrarPagoDto,
  CreateChequeDto,
} from '../types';

const BASE_URL = '/compras';

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

export const comprasApi = {
  // === PROVEEDORES ===
  getProveedores: async (filters: ProveedorFilters = {}): Promise<PaginatedResponse<Proveedor>> => {
    const response = await api.get(`${BASE_URL}/proveedores${buildParams(filters)}`);
    return response.data;
  },

  getProveedorById: async (id: number): Promise<Proveedor> => {
    const response = await api.get(`${BASE_URL}/proveedores/${id}`);
    return response.data;
  },

  createProveedor: async (data: CreateProveedorDto): Promise<Proveedor> => {
    const response = await api.post(`${BASE_URL}/proveedores`, data);
    return response.data;
  },

  updateProveedor: async (id: number, data: UpdateProveedorDto): Promise<Proveedor> => {
    const response = await api.put(`${BASE_URL}/proveedores/${id}`, data);
    return response.data;
  },

  deleteProveedor: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/proveedores/${id}`);
  },

  // === FACTURAS ===
  getFacturas: async (
    filters: FacturaFilters = {}
  ): Promise<PaginatedResponse<FacturaProveedor>> => {
    const response = await api.get(`${BASE_URL}/facturas${buildParams(filters)}`);
    return response.data;
  },

  getFacturaById: async (id: number): Promise<FacturaProveedor> => {
    const response = await api.get(`${BASE_URL}/facturas/${id}`);
    return response.data;
  },

  createFactura: async (data: CreateFacturaDto): Promise<FacturaProveedor> => {
    const response = await api.post(`${BASE_URL}/facturas`, data);
    return response.data;
  },

  updateFactura: async (id: number, data: Partial<CreateFacturaDto>): Promise<FacturaProveedor> => {
    const response = await api.put(`${BASE_URL}/facturas/${id}`, data);
    return response.data;
  },

  anularFactura: async (id: number): Promise<FacturaProveedor> => {
    const response = await api.post(`${BASE_URL}/facturas/${id}/anular`);
    return response.data;
  },

  registrarPago: async (data: RegistrarPagoDto): Promise<unknown> => {
    const response = await api.post(`${BASE_URL}/facturas/${data.facturaId}/pagos`, data);
    return response.data;
  },

  // === CHEQUES ===
  getCheques: async (filters: ChequeFilters = {}): Promise<PaginatedResponse<Cheque>> => {
    const response = await api.get(`${BASE_URL}/cheques${buildParams(filters)}`);
    return response.data;
  },

  getChequeById: async (id: number): Promise<Cheque> => {
    const response = await api.get(`${BASE_URL}/cheques/${id}`);
    return response.data;
  },

  createCheque: async (data: CreateChequeDto): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques`, data);
    return response.data;
  },

  updateCheque: async (id: number, data: Partial<CreateChequeDto>): Promise<Cheque> => {
    const response = await api.put(`${BASE_URL}/cheques/${id}`, data);
    return response.data;
  },

  depositarCheque: async (id: number, data: { cuentaDestinoId: number }): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/depositar`, data);
    return response.data;
  },

  cobrarCheque: async (id: number): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/cobrar`);
    return response.data;
  },

  endosarCheque: async (id: number, data: { endosadoA: string }): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/endosar`, data);
    return response.data;
  },

  rechazarCheque: async (id: number, data: { motivoRechazo: string }): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/rechazar`, data);
    return response.data;
  },

  anularCheque: async (id: number): Promise<Cheque> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/anular`);
    return response.data;
  },

  venderCheque: async (
    id: number,
    data: { entidadCompradora: string; tasaDescuento: number; ivaComision: number }
  ): Promise<unknown> => {
    const response = await api.post(`${BASE_URL}/cheques/${id}/vender`, data);
    return response.data;
  },

  venderBatchCheques: async (data: {
    chequeIds: number[];
    entidadCompradora: string;
    tasaDescuento: number;
    ivaComision: number;
  }): Promise<unknown> => {
    const response = await api.post(`${BASE_URL}/cheques/vender-batch`, data);
    return response.data;
  },

  acreditarVentaCheques: async (data: {
    chequeIds: number[];
    cuentaDestinoId: number;
  }): Promise<unknown> => {
    const response = await api.post(`${BASE_URL}/cheques/acreditar-venta`, data);
    return response.data;
  },
};

export default comprasApi;
