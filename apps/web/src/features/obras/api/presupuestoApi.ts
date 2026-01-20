import api from '@/lib/api';
import type { VersionPresupuesto, ItemPresupuesto, CreateItemDto, UpdateItemDto } from '../types';

const BASE_URL = '/obras';

export const presupuestoApi = {
  /**
   * Obtener presupuesto vigente de una obra
   */
  getPresupuesto: async (obraId: number, versionId?: number): Promise<VersionPresupuesto> => {
    const url = versionId
      ? `${BASE_URL}/${obraId}/presupuesto?versionId=${versionId}`
      : `${BASE_URL}/${obraId}/presupuesto`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener todas las versiones de presupuesto
   */
  getVersiones: async (
    obraId: number
  ): Promise<(VersionPresupuesto & { _count: { items: number } })[]> => {
    const response = await api.get(`${BASE_URL}/${obraId}/presupuesto/versiones`);
    return response.data;
  },

  /**
   * Crear nueva versión de presupuesto
   */
  createVersion: async (obraId: number, notas?: string): Promise<VersionPresupuesto> => {
    const response = await api.post(`${BASE_URL}/${obraId}/presupuesto/versiones`, { notas });
    return response.data;
  },

  /**
   * Agregar item al presupuesto
   */
  addItem: async (obraId: number, data: CreateItemDto): Promise<ItemPresupuesto> => {
    const response = await api.post(`${BASE_URL}/${obraId}/presupuesto/items`, data);
    return response.data;
  },

  /**
   * Actualizar item
   */
  updateItem: async (
    obraId: number,
    itemId: number,
    data: UpdateItemDto
  ): Promise<ItemPresupuesto> => {
    const response = await api.put(`${BASE_URL}/${obraId}/presupuesto/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Eliminar item
   */
  deleteItem: async (obraId: number, itemId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${obraId}/presupuesto/items/${itemId}`);
  },

  /**
   * Reordenar items
   */
  reorderItems: async (obraId: number, items: { id: number; orden: number }[]): Promise<void> => {
    await api.put(`${BASE_URL}/${obraId}/presupuesto/items/reorder`, { items });
  },
};

export default presupuestoApi;
