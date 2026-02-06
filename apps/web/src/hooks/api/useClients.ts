import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Cliente, ClienteFormData } from '../../types/client';

const CLIENTS_KEY = ['clients'];

export function useClients(search?: string) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, { search }],
    queryFn: async () => {
      const res = await api.get('/clients', {
        params: { search: search || undefined },
      });
      return (res.data?.data ?? []) as Cliente[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteFormData) => api.post('/clients', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteFormData }) =>
      api.put(`/clients/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}
