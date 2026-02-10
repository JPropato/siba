import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ClipboardList,
  AlertCircle,
  Siren,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { EstadoChart } from '../components/dashboard/EstadoChart';
import { RubroChart } from '../components/dashboard/RubroChart';
import { TipoSLAChart } from '../components/dashboard/TipoSLAChart';
import { SucursalChart } from '../components/dashboard/SucursalChart';
import { UrgentTicketsList } from '../components/dashboard/UrgentTicketsList';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { useDashboard } from '../hooks/api/useDashboard';
import { usePermissions } from '../hooks/usePermissions';
import { PageHeader } from '../components/ui/PageHeader';
import { StaggerContainer, StaggerItem, FadeIn } from '../components/ui/motion';

export function DashboardPage() {
  const { isSuperAdmin, hasPermission } = usePermissions();
  const { data, isLoading, error } = useDashboard();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canViewTickets = isSuperAdmin() || hasPermission('tickets:leer');

  if (!canViewTickets) {
    return (
      <div className="px-4 pt-3 pb-6 sm:px-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit mx-auto mb-4">
            <LayoutDashboard className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Sin acceso a indicadores
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            No tienes permisos suficientes para visualizar los KPIs operativos. Contacta a un
            administrador.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="px-4 pt-3 pb-6 sm:px-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-red-200 dark:border-red-900/30 p-12 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Error al cargar datos
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            No se pudieron obtener los datos del dashboard. Intenta nuevamente.
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
            className="mt-4 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handleClickTicket = (id: number) => navigate(`/dashboard/tickets/${id}`);

  return (
    <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Dashboard"
        subtitle="Resumen operativo de tickets en tiempo real"
        action={
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all hover:scale-105 active:scale-95"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            title="Tickets Abiertos"
            value={data.kpis.ticketsAbiertos}
            icon={ClipboardList}
            color="gold"
            description="En estados activos"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Sin Asignar"
            value={data.kpis.sinAsignar}
            icon={AlertCircle}
            color="orange"
            description="Requieren técnico"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Emergencias Activas"
            value={data.kpis.emergenciasActivas}
            icon={Siren}
            color="indigo"
            description="Tickets SEA abiertos"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Resolución Mensual"
            value={`${data.kpis.tasaResolucion}%`}
            icon={TrendingUp}
            color="emerald"
            description={`${data.kpis.finalizadosMes} de ${data.kpis.totalMes} este mes`}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FadeIn delay={0.1}>
          <EstadoChart data={data.charts.porEstado} />
        </FadeIn>
        <FadeIn delay={0.15}>
          <RubroChart data={data.charts.porRubro} />
        </FadeIn>
        <FadeIn delay={0.2}>
          <TipoSLAChart data={data.charts.porTipoSLA} />
        </FadeIn>
        <FadeIn delay={0.25}>
          <SucursalChart data={data.charts.porSucursal} />
        </FadeIn>
      </div>

      {/* Bottom: Urgent Tickets + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <FadeIn delay={0.3}>
            <UrgentTicketsList tickets={data.urgentTickets} onClickTicket={handleClickTicket} />
          </FadeIn>
        </div>
        <div>
          <FadeIn delay={0.35}>
            <RecentActivityList
              activities={data.recentActivity}
              onClickTicket={handleClickTicket}
            />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
