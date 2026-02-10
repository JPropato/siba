import { useQuery } from '@tanstack/react-query';
import { finanzasApi } from '../api/finanzasApi';

const DASHBOARD_KEY = ['finanzas', 'dashboard'];

export function useFinanzasDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => finanzasApi.getDashboard(),
  });
}
