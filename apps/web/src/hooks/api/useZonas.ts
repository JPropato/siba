import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Zona, ZonaFormData } from '../../types/zona';

const ZONAS_KEY = ['zonas'];

export function useZonas(search?: string) {
  return useQuery({
    queryKey: [...ZONAS_KEY, { search }],
    queryFn: async () => {
      const res = await api.get('/zones', {
        params: { search: search || undefined },
      });
      return (res.data?.data ?? []) as Zona[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ZonaFormData) => api.post('/zones', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ZONAS_KEY }),
  });
}

export function useUpdateZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ZonaFormData }) => api.put(`/zones/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ZONAS_KEY }),
  });
}

export function useDeleteZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ZONAS_KEY }),
  });
}
