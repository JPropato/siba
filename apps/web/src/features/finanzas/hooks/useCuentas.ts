import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';
import type { CreateCuentaDto, UpdateCuentaDto } from '../types';

const CUENTAS_KEY = ['finanzas', 'cuentas'];
const BANCOS_KEY = ['finanzas', 'bancos'];
const DASHBOARD_KEY = ['finanzas', 'dashboard'];

export function useCuentas() {
  return useQuery({
    queryKey: CUENTAS_KEY,
    queryFn: () => finanzasApi.getCuentas(),
  });
}

export function useBancos() {
  return useQuery({
    queryKey: BANCOS_KEY,
    queryFn: () => finanzasApi.getBancos(),
  });
}

export function useCreateCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCuentaDto) => finanzasApi.createCuenta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCuentaDto }) =>
      finanzasApi.updateCuenta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => finanzasApi.deleteCuenta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUENTAS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
