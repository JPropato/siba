import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasApi } from '../api/comprasApi';
import type { ProveedorFilters, CreateProveedorDto, UpdateProveedorDto } from '../types';

const PROVEEDORES_KEY = ['compras', 'proveedores'];

export function useProveedores(filters: ProveedorFilters = {}) {
  return useQuery({
    queryKey: [...PROVEEDORES_KEY, filters],
    queryFn: () => comprasApi.getProveedores(filters),
  });
}

export function useProveedor(id: number | null) {
  return useQuery({
    queryKey: [...PROVEEDORES_KEY, id],
    queryFn: () => comprasApi.getProveedorById(id!),
    enabled: !!id,
  });
}

export function useCreateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProveedorDto) => comprasApi.createProveedor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_KEY });
    },
  });
}

export function useUpdateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProveedorDto }) =>
      comprasApi.updateProveedor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_KEY });
    },
  });
}

export function useDeleteProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.deleteProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_KEY });
    },
  });
}
