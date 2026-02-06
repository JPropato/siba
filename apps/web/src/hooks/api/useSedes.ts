import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Sede, SedeFormData } from '../../types/sedes';

const SEDES_KEY = ['sedes'];

export function useSedes(search?: string) {
  return useQuery({
    queryKey: [...SEDES_KEY, { search }],
    queryFn: async () => {
      const res = await api.get('/sedes', {
        params: { search: search || undefined },
      });
      return (res.data?.data ?? []) as Sede[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SedeFormData) => api.post('/sedes', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SEDES_KEY }),
  });
}

export function useUpdateSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SedeFormData }) => api.put(`/sedes/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SEDES_KEY }),
  });
}

export function useDeleteSede() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/sedes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SEDES_KEY }),
  });
}
