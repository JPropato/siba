import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';
import type { MovimientoFilters, CreateMovimientoDto } from '../types';

const MOVIMIENTOS_KEY = ['finanzas', 'movimientos'];
const DASHBOARD_KEY = ['finanzas', 'dashboard'];
const CUENTAS_KEY = ['finanzas', 'cuentas'];

export function useMovimientos(filters: MovimientoFilters = {}) {
  return useQuery({
    queryKey: [...MOVIMIENTOS_KEY, filters],
    queryFn: () => finanzasApi.getMovimientos(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovimientoDto) => finanzasApi.createMovimiento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVIMIENTOS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: CUENTAS_KEY });
    },
  });
}
