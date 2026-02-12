import { useQuery } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';

export function useBalanceContable(fechaHasta?: string) {
  return useQuery({
    queryKey: ['finanzas', 'balance-contable', fechaHasta],
    queryFn: () => finanzasApi.getBalanceContable(fechaHasta),
  });
}
