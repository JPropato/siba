import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Material, MaterialFormData } from '../../types/materiales';

const MATERIALS_KEY = ['materials'];

export function useMateriales(params?: {
  search?: string;
  categoria?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...MATERIALS_KEY, params],
    queryFn: async () => {
      const res = await api.get('/materials', {
        params: {
          search: params?.search || undefined,
          categoria: params?.categoria || undefined,
          page: params?.page,
          limit: params?.limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as Material[],
        totalPages: (res.data?.meta?.totalPages ?? 1) as number,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MaterialFormData) => api.post('/materials', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MATERIALS_KEY }),
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaterialFormData }) =>
      api.put(`/materials/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MATERIALS_KEY }),
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/materials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MATERIALS_KEY }),
  });
}
