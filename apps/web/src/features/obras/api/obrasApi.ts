import api from '@/lib/api';
import type {
  Obra,
  CreateObraDto,
  UpdateObraDto,
  ObraListResponse,
  ObraFilters,
  EstadoObra,
  ArchivoObra,
  ComentarioObra,
  HistorialEstadoObra,
} from '../types';

const BASE_URL = '/obras';

export const obrasApi = {
  /**
   * Listar obras con filtros y paginación
   */
  getAll: async (filters: ObraFilters = {}): Promise<ObraListResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.clienteId) params.append('clienteId', String(filters.clienteId));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener detalle de una obra por ID
   */
  getById: async (id: number): Promise<Obra> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Crear nueva obra
   */
  create: async (data: CreateObraDto): Promise<Obra> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualizar una obra existente
   */
  update: async (id: number, data: UpdateObraDto): Promise<Obra> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Cambiar estado de una obra
   */
  cambiarEstado: async (id: number, estado: EstadoObra, observacion?: string): Promise<Obra> => {
    const response = await api.patch(`${BASE_URL}/${id}/estado`, {
      estado,
      observacion,
    });
    return response.data;
  },

  /**
   * Eliminar una obra (solo en estado BORRADOR)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Generar PDF del presupuesto
   */
  generarPDF: async (
    obraId: number,
    versionId?: number
  ): Promise<{ success: boolean; archivo: { url: string } }> => {
    const response = await api.post(`${BASE_URL}/${obraId}/presupuesto/generar-pdf`, {
      versionId,
    });
    return response.data;
  },

  // --- Archivos ---
  getArchivos: async (obraId: number): Promise<ArchivoObra[]> => {
    const response = await api.get(`${BASE_URL}/${obraId}/archivos`);
    return response.data;
  },

  uploadArchivo: async (
    obraId: number,
    file: File,
    tipoArchivo: string = 'OTRO'
  ): Promise<ArchivoObra> => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipoArchivo', tipoArchivo);
    const response = await api.post(`${BASE_URL}/${obraId}/archivos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteArchivo: async (obraId: number, archivoId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${obraId}/archivos/${archivoId}`);
  },

  // --- Comentarios ---
  getComentarios: async (obraId: number): Promise<ComentarioObra[]> => {
    const response = await api.get(`${BASE_URL}/${obraId}/comentarios`);
    return response.data;
  },

  createComentario: async (obraId: number, contenido: string): Promise<ComentarioObra> => {
    const response = await api.post(`${BASE_URL}/${obraId}/comentarios`, { contenido });
    return response.data;
  },

  deleteComentario: async (obraId: number, comentarioId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${obraId}/comentarios/${comentarioId}`);
  },

  // --- Historial ---
  getHistorial: async (obraId: number): Promise<HistorialEstadoObra[]> => {
    const response = await api.get(`${BASE_URL}/${obraId}/historial`);
    return response.data;
  },
};

export default obrasApi;
