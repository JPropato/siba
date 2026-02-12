import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasApi } from '../api/comprasApi';
import type { FacturaFilters, CreateFacturaDto, RegistrarPagoDto } from '../types';

const FACTURAS_KEY = ['compras', 'facturas'];

export function useFacturasProveedor(filters: FacturaFilters = {}) {
  return useQuery({
    queryKey: [...FACTURAS_KEY, filters],
    queryFn: () => comprasApi.getFacturas(filters),
  });
}

export function useFacturaProveedor(id: number | null) {
  return useQuery({
    queryKey: [...FACTURAS_KEY, id],
    queryFn: () => comprasApi.getFacturaById(id!),
    enabled: !!id,
  });
}

export function useCreateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacturaDto) => comprasApi.createFactura(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_KEY });
    },
  });
}

export function useUpdateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFacturaDto> }) =>
      comprasApi.updateFactura(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_KEY });
    },
  });
}

export function useAnularFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.anularFactura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_KEY });
    },
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegistrarPagoDto) => comprasApi.registrarPago(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FACTURAS_KEY });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['compras', 'cheques'] });
    },
  });
}
