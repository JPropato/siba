import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export interface DashboardData {
  kpis: {
    ticketsAbiertos: number;
    sinAsignar: number;
    emergenciasActivas: number;
    tasaResolucion: number;
    totalMes: number;
    finalizadosMes: number;
  };
  charts: {
    porEstado: Array<{ estado: string; count: number }>;
    porRubro: Array<{ rubro: string; count: number }>;
    porTipoSLA: Array<{ tipoTicket: string; count: number }>;
    porSucursal: Array<{ sucursalId: number; nombre: string; count: number }>;
  };
  urgentTickets: Array<{
    id: number;
    codigoInterno: number;
    descripcion: string;
    tipoTicket: string;
    estado: string;
    fechaCreacion: string;
    diasAbiertos: number;
    sucursal: { nombre: string };
  }>;
  recentActivity: Array<{
    id: number;
    ticketId: number;
    codigoInterno: number;
    campoModificado: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
    observacion: string | null;
    fechaCambio: string;
    usuario: { nombre: string; apellido: string };
  }>;
}

const DASHBOARD_KEY = ['dashboard'];

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: async () => {
      const res = await api.get<DashboardData>('/tickets/dashboard');
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
