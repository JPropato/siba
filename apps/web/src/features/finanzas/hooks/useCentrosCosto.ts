import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';
import type { CentroCosto } from '../types';

const CENTROS_COSTO_KEY = ['finanzas', 'centros-costo'];

export function useCentrosCosto() {
  return useQuery({
    queryKey: CENTROS_COSTO_KEY,
    queryFn: () => finanzasApi.getCentrosCosto(),
  });
}

export function useCreateCentroCosto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CentroCosto>) => finanzasApi.createCentroCosto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CENTROS_COSTO_KEY });
    },
  });
}

export function useUpdateCentroCosto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CentroCosto> }) =>
      finanzasApi.updateCentroCosto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CENTROS_COSTO_KEY });
    },
  });
}

export function useDeleteCentroCosto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => finanzasApi.deleteCentroCosto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CENTROS_COSTO_KEY });
    },
  });
}
