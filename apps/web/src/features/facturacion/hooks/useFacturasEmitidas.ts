import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturacionApi } from '../api/facturacionApi';
import type { FacturaEmitidaFilters, CreateFacturaEmitidaDto, RegistrarCobroDto } from '../types';

const FACTURAS_EMITIDAS_KEY = ['facturacion', 'facturas-emitidas'];

export function useFacturasEmitidas(filters: FacturaEmitidaFilters = {}) {
  return useQuery({
    queryKey: [...FACTURAS_EMITIDAS_KEY, filters],
    queryFn: () => facturacionApi.getFacturasEmitidas(filters),
  });
}

export function useFacturaEmitida(id: number | null) {
  return useQuery({
    queryKey: [...FACTURAS_EMITIDAS_KEY, id],
    queryFn: () => facturacionApi.getFacturaEmitidaById(id!),
    enabled: !!id,
  });
}

export function useCreateFacturaEmitida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacturaEmitidaDto) => facturacionApi.createFacturaEmitida(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_EMITIDAS_KEY });
    },
  });
}

export function useUpdateFacturaEmitida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFacturaEmitidaDto> }) =>
      facturacionApi.updateFacturaEmitida(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_EMITIDAS_KEY });
    },
  });
}

export function useAnularFacturaEmitida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => facturacionApi.anularFacturaEmitida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_EMITIDAS_KEY });
    },
  });
}

export function useRegistrarCobro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facturaId, ...data }: RegistrarCobroDto) =>
      facturacionApi.registrarCobro(facturaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_EMITIDAS_KEY });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['compras', 'cheques'] });
    },
  });
}
