import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface Tecnico {
  id: number;
  nombre: string;
  apellido: string;
  tipo: string;
}

export function useTecnicos() {
  return useQuery({
    queryKey: ['tecnicos'],
    queryFn: async () => {
      const res = await api.get('/empleados', {
        params: { tipo: 'TECNICO', limit: 100 },
      });
      return (res.data.data || []) as Tecnico[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
