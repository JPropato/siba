import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  Empleado,
  EmpleadoFormData,
  SeguroAP,
  SeguroAPFormData,
  ResumenSegurosAP,
} from '../../types/empleados';

const EMPLEADOS_KEY = ['empleados'];
const SEGUROS_AP_KEY = ['empleados', 'seguros-ap'];

// --- Empleados ---

interface EmpleadoFilters {
  search?: string;
  estado?: string;
  tipo?: string;
  zonaId?: number;
  categoriaLaboral?: string;
  tipoContrato?: string;
}

export function useEmpleados(filters: EmpleadoFilters = {}, page = 1, limit = 10) {
  const { search, estado, tipo, zonaId, categoriaLaboral, tipoContrato } = filters;
  return useQuery({
    queryKey: [
      ...EMPLEADOS_KEY,
      { search, estado, tipo, zonaId, categoriaLaboral, tipoContrato, page, limit },
    ],
    queryFn: async () => {
      const res = await api.get('/empleados', {
        params: {
          search: search || undefined,
          estado: estado || undefined,
          tipo: tipo || undefined,
          zonaId: zonaId || undefined,
          categoriaLaboral: categoriaLaboral || undefined,
          tipoContrato: tipoContrato || undefined,
          page,
          limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as Empleado[],
        totalPages: (res.data?.meta?.totalPages ?? 1) as number,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmpleadoFormData) => api.post('/empleados', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}

export function useUpdateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpleadoFormData }) =>
      api.put(`/empleados/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}

export function useDeleteEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/empleados/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY }),
  });
}

// --- Seguros AP ---

export function useSegurosAP(
  filters: { estado?: string; search?: string } = {},
  page = 1,
  limit = 10
) {
  return useQuery({
    queryKey: [...SEGUROS_AP_KEY, { ...filters, page, limit }],
    queryFn: async () => {
      const res = await api.get('/empleados/seguros-ap', {
        params: {
          estado: filters.estado || undefined,
          search: filters.search || undefined,
          page,
          limit,
        },
      });
      return {
        data: (res.data?.data ?? []) as SeguroAP[],
        totalPages: (res.data?.meta?.totalPages ?? 1) as number,
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useSegurosAPByEmpleado(empleadoId: number) {
  return useQuery({
    queryKey: [...SEGUROS_AP_KEY, 'empleado', empleadoId],
    queryFn: async () => {
      const res = await api.get(`/empleados/${empleadoId}/seguros-ap`);
      return res.data as SeguroAP[];
    },
    enabled: !!empleadoId,
  });
}

export function useResumenSegurosAP() {
  return useQuery({
    queryKey: [...SEGUROS_AP_KEY, 'resumen'],
    queryFn: async () => {
      const res = await api.get('/empleados/seguros-ap/resumen');
      return res.data as ResumenSegurosAP;
    },
  });
}

export function useCreateSeguroAP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SeguroAPFormData) =>
      api.post(`/empleados/${data.empleadoId}/seguros-ap`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEGUROS_AP_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY });
    },
  });
}

export function useUpdateSeguroAP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seguroId, data }: { seguroId: number; data: Partial<SeguroAPFormData> }) =>
      api.put(`/empleados/seguros-ap/${seguroId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEGUROS_AP_KEY });
    },
  });
}

export function useCambiarEstadoSeguroAP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      seguroId,
      nuevoEstado,
      fechaEfectiva,
    }: {
      seguroId: number;
      nuevoEstado: string;
      fechaEfectiva?: string;
    }) => api.post(`/empleados/seguros-ap/${seguroId}/estado`, { nuevoEstado, fechaEfectiva }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEGUROS_AP_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLEADOS_KEY });
    },
  });
}
