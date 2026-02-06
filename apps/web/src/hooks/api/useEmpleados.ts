import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Empleado, EmpleadoFormData } from '../../types/empleados';

const EMPLEADOS_KEY = ['empleados'];

export function useEmpleados(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...EMPLEADOS_KEY, { search, page, limit }],
    queryFn: async () => {
      const res = await api.get('/empleados', {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as Empleado[],
        totalPages: (res.data?.meta?.totalPages ?? 1) as number,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmpleadoFormData) => api.post('/empleados', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}

export function useUpdateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpleadoFormData }) =>
      api.put(`/empleados/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}

export function useDeleteEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/empleados/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}
