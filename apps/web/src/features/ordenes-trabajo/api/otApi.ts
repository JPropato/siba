import api from '../../../lib/api';
import type {
  OrdenTrabajo,
  CreateOTPayload,
  UpdateOTPayload,
  FinalizarOTPayload,
  Archivo,
} from '../types';

export const otApi = {
  /**
   * List all work orders
   */
  getAll: async (params?: { page?: number; limit?: number; ticketId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.ticketId) searchParams.append('ticketId', String(params.ticketId));

    const res = await api.get<{
      data: OrdenTrabajo[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/ordenes-trabajo?${searchParams}`);
    return res.data;
  },

  /**
   * Get single work order by ID
   */
  getById: async (id: number): Promise<OrdenTrabajo> => {
    const res = await api.get<OrdenTrabajo>(`/ordenes-trabajo/${id}`);
    return res.data;
  },

  /**
   * Get work order by ticket ID
   */
  getByTicketId: async (ticketId: number): Promise<OrdenTrabajo | null> => {
    const res = await api.get<{ data: OrdenTrabajo[] }>(
      `/ordenes-trabajo?ticketId=${ticketId}&limit=1`
    );
    return res.data.data[0] || null;
  },

  /**
   * Create work order from ticket
   */
  create: async (data: CreateOTPayload): Promise<OrdenTrabajo> => {
    const res = await api.post<OrdenTrabajo>('/ordenes-trabajo', data);
    return res.data;
  },

  /**
   * Update work order
   */
  update: async (id: number, data: UpdateOTPayload): Promise<OrdenTrabajo> => {
    const res = await api.put<OrdenTrabajo>(`/ordenes-trabajo/${id}`, data);
    return res.data;
  },

  /**
   * Finalize work order (with signature)
   */
  finalizar: async (id: number, data: FinalizarOTPayload): Promise<{ success: boolean }> => {
    const res = await api.post<{ success: boolean }>(`/ordenes-trabajo/${id}/finalizar`, data);
    return res.data;
  },

  /**
   * Delete work order
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/ordenes-trabajo/${id}`);
  },

  /**
   * Upload file to work order
   */
  uploadFile: async (file: File, ordenTrabajoId: number): Promise<Archivo> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ordenTrabajoId', String(ordenTrabajoId));

    const res = await api.post<{ success: boolean; data: Archivo }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  /**
   * Delete file
   */
  deleteFile: async (fileId: number): Promise<void> => {
    await api.delete(`/upload/${fileId}`);
  },
};

export default otApi;
