import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  Vehiculo,
  VehiculoFormData,
  MultaVehiculo,
  MultaVehiculoFormData,
  ResumenVehiculos,
  EstadoMultaVehiculo,
} from '../../types/vehiculos';

const VEHICULOS_KEY = ['vehiculos'];
const MULTAS_KEY = ['vehiculos', 'multas'];

export function useVehiculos(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...VEHICULOS_KEY, { search, page, limit }],
    queryFn: async () => {
      const res = await api.get('/vehiculos', {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as Vehiculo[],
        totalPages: res.data?.meta?.totalPages ?? 1,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehiculoFormData) => api.post('/vehiculos', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY }),
  });
}

export function useUpdateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: VehiculoFormData }) =>
      api.put(`/vehiculos/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY }),
  });
}

export function useDeleteVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/vehiculos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY }),
  });
}

// Resumen
export function useResumenVehiculos() {
  return useQuery({
    queryKey: [...VEHICULOS_KEY, 'resumen'],
    queryFn: async () => {
      const res = await api.get('/vehiculos/resumen');
      return res.data as ResumenVehiculos;
    },
  });
}

// Multas por vehiculo
export function useMultasVehiculo(vehiculoId: number) {
  return useQuery({
    queryKey: [...MULTAS_KEY, 'vehiculo', vehiculoId],
    queryFn: async () => {
      const res = await api.get(`/vehiculos/${vehiculoId}/multas`);
      return res.data as MultaVehiculo[];
    },
    enabled: !!vehiculoId,
  });
}

// Multas globales con paginacion
export function useMultasAll(
  filters: { tipo?: string; estado?: string; search?: string } = {},
  page = 1,
  limit = 10
) {
  return useQuery({
    queryKey: [...MULTAS_KEY, { ...filters, page, limit }],
    queryFn: async () => {
      const res = await api.get('/vehiculos/multas', {
        params: {
          tipo: filters.tipo || undefined,
          estado: filters.estado || undefined,
          search: filters.search || undefined,
          page,
          limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as MultaVehiculo[],
        totalPages: (res.data?.meta?.totalPages ?? 1) as number,
      };
    },
    placeholderData: (prev) => prev,
  });
}

// CRUD Multas
export function useCreateMulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MultaVehiculoFormData) =>
      api.post(`/vehiculos/${data.vehiculoId}/multas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MULTAS_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY });
    },
  });
}

export function useUpdateMulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      multaId,
      data,
    }: {
      multaId: number;
      data: Partial<
        MultaVehiculoFormData & { estado: EstadoMultaVehiculo; fechaPago: string | null }
      >;
    }) => api.put(`/vehiculos/multas/${multaId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MULTAS_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY });
    },
  });
}

export function useDeleteMulta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (multaId: number) => api.delete(`/vehiculos/multas/${multaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MULTAS_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICULOS_KEY });
    },
  });
}
