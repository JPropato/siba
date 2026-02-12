import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaContable } from '../types';

const CUENTAS_CONTABLES_KEY = ['finanzas', 'cuentas-contables'];

export function useCuentasContables(params?: { tipo?: string; imputable?: boolean }) {
  return useQuery({
    queryKey: [...CUENTAS_CONTABLES_KEY, params],
    queryFn: () => finanzasApi.getCuentasContables(params),
  });
}

export function useCreateCuentaContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CuentaContable>) => finanzasApi.createCuentaContable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_CONTABLES_KEY });
    },
  });
}

export function useUpdateCuentaContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CuentaContable> }) =>
      finanzasApi.updateCuentaContable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_CONTABLES_KEY });
    },
  });
}

export function useDeleteCuentaContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => finanzasApi.deleteCuentaContable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_CONTABLES_KEY });
    },
  });
}
