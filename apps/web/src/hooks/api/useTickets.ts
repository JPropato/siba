import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Ticket, EstadoTicket } from '../../types/tickets';

const TICKETS_KEY = ['tickets'];

export interface TicketsParams {
  search?: string;
  estado?: string;
  rubro?: string;
  tipoTicket?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TicketsResponse {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useTickets(params: TicketsParams) {
  return useQuery({
    queryKey: [...TICKETS_KEY, params],
    queryFn: async () => {
      const res = await api.get('/tickets', {
        params: {
          search: params.search || undefined,
          estado: params.estado || undefined,
          rubro: params.rubro || undefined,
          tipoTicket: params.tipoTicket || undefined,
          page: params.page || 1,
          limit: params.limit || 10,
          sortBy: params.sortBy || undefined,
          sortDir: params.sortDir || undefined,
        },
      });
      return res.data as TicketsResponse;
    },
    placeholderData: (prev) => prev,
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tickets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}

export function useUpdateTicketEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoTicket }) =>
      api.patch(`/tickets/${id}/estado`, { estado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}
