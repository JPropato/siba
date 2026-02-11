import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/auditApi';
import type { AuditFilters } from '../api/auditApi';

export function useAuditEventos(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', 'eventos', filters],
    queryFn: () => auditApi.getEventos(filters),
  });
}

export function useAuditModulos() {
  return useQuery({
    queryKey: ['audit', 'modulos'],
    queryFn: () => auditApi.getModulos(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuditAcciones() {
  return useQuery({
    queryKey: ['audit', 'acciones'],
    queryFn: () => auditApi.getAcciones(),
    staleTime: 5 * 60 * 1000,
  });
}
