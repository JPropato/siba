import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasApi } from '../api/comprasApi';
import type { ChequeFilters, CreateChequeDto } from '../types';

const CHEQUES_KEY = ['compras', 'cheques'];

export function useCheques(filters: ChequeFilters = {}) {
  return useQuery({
    queryKey: [...CHEQUES_KEY, filters],
    queryFn: () => comprasApi.getCheques(filters),
  });
}

export function useCheque(id: number | null) {
  return useQuery({
    queryKey: [...CHEQUES_KEY, id],
    queryFn: () => comprasApi.getChequeById(id!),
    enabled: !!id,
  });
}

export function useCreateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChequeDto) => comprasApi.createCheque(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useUpdateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateChequeDto> }) =>
      comprasApi.updateCheque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useDepositarCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cuentaDestinoId }: { id: number; cuentaDestinoId: number }) =>
      comprasApi.depositarCheque(id, { cuentaDestinoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useCobrarCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.cobrarCheque(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
    },
  });
}

export function useEndosarCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endosadoA }: { id: number; endosadoA: string }) =>
      comprasApi.endosarCheque(id, { endosadoA }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useRechazarCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivoRechazo }: { id: number; motivoRechazo: string }) =>
      comprasApi.rechazarCheque(id, { motivoRechazo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useAnularCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.anularCheque(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useVenderCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      entidadCompradora: string;
      tasaDescuento: number;
      ivaComision: number;
    }) => comprasApi.venderCheque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useVenderBatchCheques() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      chequeIds: number[];
      entidadCompradora: string;
      tasaDescuento: number;
      ivaComision: number;
    }) => comprasApi.venderBatchCheques(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
    },
  });
}

export function useAcreditarVentaCheques() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chequeIds: number[]; cuentaDestinoId: number }) =>
      comprasApi.acreditarVentaCheques(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHEQUES_KEY });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
    },
  });
}
