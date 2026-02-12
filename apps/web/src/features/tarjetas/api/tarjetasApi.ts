import api from '@/lib/api';
import type {
  TarjetaPrecargable,
  TarjetaFormData,
  CargaTarjeta,
  CargaFormData,
  GastoTarjeta,
  GastoFormData,
  Rendicion,
  RendicionFormData,
  ConfigCategoriaGasto,
  ResumenTarjetas,
  Proveedor,
} from '../types';

const BASE_URL = '/tarjetas';

export const tarjetasApi = {
  // === TARJETAS ===
  getTarjetas: async (
    params?: Record<string, string | number | boolean>
  ): Promise<{ data: TarjetaPrecargable[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getTarjeta: async (id: number): Promise<TarjetaPrecargable> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createTarjeta: async (data: TarjetaFormData): Promise<TarjetaPrecargable> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  updateTarjeta: async (
    id: number,
    data: Partial<TarjetaFormData>
  ): Promise<TarjetaPrecargable> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteTarjeta: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  getResumenTarjetas: async (): Promise<ResumenTarjetas> => {
    const response = await api.get(`${BASE_URL}/resumen`);
    return response.data;
  },

  // === CONFIG CATEGORIAS ===
  getConfigCategorias: async (): Promise<ConfigCategoriaGasto[]> => {
    const response = await api.get(`${BASE_URL}/config-categorias`);
    return response.data;
  },

  updateConfigCategoria: async (
    id: number,
    cuentaContableId: number
  ): Promise<ConfigCategoriaGasto> => {
    const response = await api.put(`${BASE_URL}/config-categorias/${id}`, { cuentaContableId });
    return response.data;
  },

  // === CARGAS ===
  getCargas: async (
    tarjetaId: number,
    params?: Record<string, string | number | boolean>
  ): Promise<{ data: CargaTarjeta[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`${BASE_URL}/${tarjetaId}/cargas`, { params });
    return response.data;
  },

  createCarga: async (tarjetaId: number, data: CargaFormData): Promise<CargaTarjeta> => {
    const response = await api.post(`${BASE_URL}/${tarjetaId}/cargas`, data);
    return response.data;
  },

  // === GASTOS ===
  getGastos: async (
    tarjetaId: number,
    params?: Record<string, string | number | boolean>
  ): Promise<{ data: GastoTarjeta[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`${BASE_URL}/${tarjetaId}/gastos`, { params });
    return response.data;
  },

  createGasto: async (tarjetaId: number, data: GastoFormData): Promise<GastoTarjeta> => {
    const response = await api.post(`${BASE_URL}/${tarjetaId}/gastos`, data);
    return response.data;
  },

  updateGasto: async (gastoId: number, data: Partial<GastoFormData>): Promise<GastoTarjeta> => {
    const response = await api.put(`${BASE_URL}/gastos/${gastoId}`, data);
    return response.data;
  },

  deleteGasto: async (gastoId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/gastos/${gastoId}`);
  },

  getProveedoresFrecuentes: async (tarjetaId: number): Promise<Proveedor[]> => {
    const response = await api.get(`${BASE_URL}/${tarjetaId}/proveedores-frecuentes`);
    return response.data;
  },

  // === RENDICIONES ===
  getRendiciones: async (
    params?: Record<string, string | number | boolean>
  ): Promise<{ data: Rendicion[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`${BASE_URL}/rendiciones`, { params });
    return response.data;
  },

  createRendicion: async (data: RendicionFormData): Promise<Rendicion> => {
    const response = await api.post(`${BASE_URL}/rendiciones`, data);
    return response.data;
  },

  cerrarRendicion: async (id: number): Promise<Rendicion> => {
    const response = await api.post(`${BASE_URL}/rendiciones/${id}/cerrar`);
    return response.data;
  },

  aprobarRendicion: async (id: number): Promise<Rendicion> => {
    const response = await api.post(`${BASE_URL}/rendiciones/${id}/aprobar`);
    return response.data;
  },

  rechazarRendicion: async (id: number, motivoRechazo: string): Promise<Rendicion> => {
    const response = await api.post(`${BASE_URL}/rendiciones/${id}/rechazar`, { motivoRechazo });
    return response.data;
  },
};

export default tarjetasApi;
