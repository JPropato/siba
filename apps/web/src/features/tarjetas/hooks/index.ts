import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tarjetasApi } from '../api/tarjetasApi';
import type { TarjetaFormData, CargaFormData, GastoFormData, RendicionFormData } from '../types';

const TARJETAS_KEY = ['tarjetas'];
const CARGAS_KEY = ['tarjetas', 'cargas'];
const GASTOS_KEY = ['tarjetas', 'gastos'];
const RENDICIONES_KEY = ['tarjetas', 'rendiciones'];
const CONFIG_KEY = ['tarjetas', 'config-categorias'];

// --- Tarjetas ---
export function useTarjetas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...TARJETAS_KEY, params],
    queryFn: () => tarjetasApi.getTarjetas(params),
    placeholderData: (prev) => prev,
  });
}

export function useTarjeta(id: number | null) {
  return useQuery({
    queryKey: [...TARJETAS_KEY, id],
    queryFn: () => tarjetasApi.getTarjeta(id!),
    enabled: !!id,
  });
}

export function useResumenTarjetas() {
  return useQuery({
    queryKey: [...TARJETAS_KEY, 'resumen'],
    queryFn: tarjetasApi.getResumenTarjetas,
  });
}

export function useCreateTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TarjetaFormData) => tarjetasApi.createTarjeta(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
    },
  });
}

export function useUpdateTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TarjetaFormData> }) =>
      tarjetasApi.updateTarjeta(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
    },
  });
}

export function useDeleteTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tarjetasApi.deleteTarjeta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
    },
  });
}

// --- Config Categorias ---
export function useConfigCategorias() {
  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: tarjetasApi.getConfigCategorias,
  });
}

export function useUpdateConfigCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cuentaContableId }: { id: number; cuentaContableId: number }) =>
      tarjetasApi.updateConfigCategoria(id, cuentaContableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONFIG_KEY });
    },
  });
}

// --- Cargas ---
export function useCargas(tarjetaId: number | null, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...CARGAS_KEY, tarjetaId, params],
    queryFn: () => tarjetasApi.getCargas(tarjetaId!, params),
    enabled: !!tarjetaId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateCarga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tarjetaId, data }: { tarjetaId: number; data: CargaFormData }) =>
      tarjetasApi.createCarga(tarjetaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARGAS_KEY });
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
    },
  });
}

// --- Gastos ---
export function useGastos(tarjetaId: number | null, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...GASTOS_KEY, tarjetaId, params],
    queryFn: () => tarjetasApi.getGastos(tarjetaId!, params),
    enabled: !!tarjetaId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tarjetaId, data }: { tarjetaId: number; data: GastoFormData }) =>
      tarjetasApi.createGasto(tarjetaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
    },
  });
}

export function useUpdateGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gastoId, data }: { gastoId: number; data: Partial<GastoFormData> }) =>
      tarjetasApi.updateGasto(gastoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
    },
  });
}

export function useDeleteGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gastoId: number) => tarjetasApi.deleteGasto(gastoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
    },
  });
}

export function useProveedoresFrecuentes(tarjetaId: number | null) {
  return useQuery({
    queryKey: ['tarjetas', 'proveedores-frecuentes', tarjetaId],
    queryFn: () => tarjetasApi.getProveedoresFrecuentes(tarjetaId!),
    enabled: !!tarjetaId,
  });
}

// --- Rendiciones ---
export function useRendiciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...RENDICIONES_KEY, params],
    queryFn: () => tarjetasApi.getRendiciones(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRendicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RendicionFormData) => tarjetasApi.createRendicion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
      qc.invalidateQueries({ queryKey: TARJETAS_KEY });
    },
  });
}

export function useCerrarRendicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tarjetasApi.cerrarRendicion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
    },
  });
}

export function useAprobarRendicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tarjetasApi.aprobarRendicion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}

export function useRechazarRendicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivoRechazo }: { id: number; motivoRechazo: string }) =>
      tarjetasApi.rechazarRendicion(id, motivoRechazo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENDICIONES_KEY });
      qc.invalidateQueries({ queryKey: GASTOS_KEY });
    },
  });
}
