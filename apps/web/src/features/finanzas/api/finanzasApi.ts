import api from '@/lib/api';
import type {
  Banco,
  CuentaFinanciera,
  Movimiento,
  DashboardFinanzas,
  MovimientoFilters,
  MovimientosListResponse,
  CreateCuentaDto,
  UpdateCuentaDto,
  CreateMovimientoDto,
  UpdateMovimientoDto,
  CreateTransferenciaDto,
} from '../types';

const BASE_URL = '/finanzas';

export const finanzasApi = {
  // === DASHBOARD / REPORTES ===
  getDashboard: async (): Promise<DashboardFinanzas> => {
    const response = await api.get(`${BASE_URL}/dashboard`);
    return response.data;
  },

  getSaldos: async (): Promise<{
    cuentas: Array<{ id: number; nombre: string; saldoActual: number }>;
    total: number;
  }> => {
    const response = await api.get(`${BASE_URL}/saldos`);
    return response.data;
  },

  // === BANCOS ===
  getBancos: async (): Promise<Banco[]> => {
    const response = await api.get(`${BASE_URL}/bancos`);
    return response.data;
  },

  createBanco: async (data: Partial<Banco>): Promise<Banco> => {
    const response = await api.post(`${BASE_URL}/bancos`, data);
    return response.data;
  },

  updateBanco: async (id: number, data: Partial<Banco>): Promise<Banco> => {
    const response = await api.put(`${BASE_URL}/bancos/${id}`, data);
    return response.data;
  },

  // === CUENTAS ===
  getCuentas: async (): Promise<CuentaFinanciera[]> => {
    const response = await api.get(`${BASE_URL}/cuentas`);
    return response.data;
  },

  getCuentaById: async (id: number): Promise<CuentaFinanciera> => {
    const response = await api.get(`${BASE_URL}/cuentas/${id}`);
    return response.data;
  },

  createCuenta: async (data: CreateCuentaDto): Promise<CuentaFinanciera> => {
    const response = await api.post(`${BASE_URL}/cuentas`, data);
    return response.data;
  },

  updateCuenta: async (id: number, data: UpdateCuentaDto): Promise<CuentaFinanciera> => {
    const response = await api.put(`${BASE_URL}/cuentas/${id}`, data);
    return response.data;
  },

  deleteCuenta: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/cuentas/${id}`);
  },

  // === MOVIMIENTOS ===
  getMovimientos: async (filters: MovimientoFilters = {}): Promise<MovimientosListResponse> => {
    const params = new URLSearchParams();
    if (filters.cuentaId) params.append('cuentaId', String(filters.cuentaId));
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`${BASE_URL}/movimientos?${params.toString()}`);
    return response.data;
  },

  getMovimientoById: async (id: number): Promise<Movimiento> => {
    const response = await api.get(`${BASE_URL}/movimientos/${id}`);
    return response.data;
  },

  createMovimiento: async (data: CreateMovimientoDto): Promise<Movimiento> => {
    const response = await api.post(`${BASE_URL}/movimientos`, data);
    return response.data;
  },

  updateMovimiento: async (id: number, data: UpdateMovimientoDto): Promise<Movimiento> => {
    const response = await api.put(`${BASE_URL}/movimientos/${id}`, data);
    return response.data;
  },

  anularMovimiento: async (id: number, motivo?: string): Promise<Movimiento> => {
    const response = await api.post(`${BASE_URL}/movimientos/${id}/anular`, { motivo });
    return response.data;
  },

  confirmarMovimiento: async (id: number): Promise<Movimiento> => {
    const response = await api.post(`${BASE_URL}/movimientos/${id}/confirmar`);
    return response.data;
  },

  // === TRANSFERENCIAS ===
  createTransferencia: async (
    data: CreateTransferenciaDto
  ): Promise<{ egreso: Movimiento; ingreso: Movimiento; transferenciaRef: string }> => {
    const response = await api.post(`${BASE_URL}/transferencias`, data);
    return response.data;
  },
};

export default finanzasApi;
