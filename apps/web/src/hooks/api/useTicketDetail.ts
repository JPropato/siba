import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Ticket } from '../../types/tickets';

export function useTicketDetail(id: number | null) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data as Ticket;
    },
    enabled: !!id,
  });
}
