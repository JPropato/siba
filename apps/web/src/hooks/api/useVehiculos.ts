import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Vehiculo, VehiculoFormData } from '../../types/vehiculos';

const VEHICULOS_KEY = ['vehiculos'];

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
