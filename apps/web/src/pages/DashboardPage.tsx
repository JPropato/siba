import { StatCard } from '../components/dashboard/StatCard';
import {
  ClipboardList,
  Clock,
  HardHat,
  DollarSign,
  LayoutDashboard,
  CalendarDays,
  Plus
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export function DashboardPage() {
  const { isSuperAdmin, hasPermission } = usePermissions();

  const kpis = [
    {
      id: 'tickets-abiertos',
      title: 'Tickets Abiertos',
      value: '24',
      icon: ClipboardList,
      color: 'gold' as const,
      claim: 'dashboard:kpi_tickets_abiertos',
      trend: { value: '12%', positive: false },
      description: 'Tickets pendientes de atención'
    },
    {
      id: 'tickets-promedio',
      title: 'Resolución Promedio',
      value: '4.2h',
      icon: Clock,
      color: 'indigo' as const,
      claim: 'dashboard:kpi_tickets_promedio',
      trend: { value: '0.5h', positive: true },
      description: 'Tiempo medio de cierre'
    },
    {
      id: 'obras-activas',
      title: 'Obras en Ejecución',
      value: '18',
      icon: HardHat,
      color: 'orange' as const,
      claim: 'dashboard:kpi_obras_activas',
      trend: { value: '+2', positive: true },
      description: 'Frentes de trabajo abiertos'
    },
    {
      id: 'obras-presupuesto',
      title: 'Presupuesto Total',
      value: '$4.2M',
      icon: DollarSign,
      color: 'emerald' as const,
      claim: 'dashboard:kpi_obras_presupuesto',
      trend: { value: '5%', positive: true },
      description: 'Monto total obras activas'
    }
  ];

  // Filtrar KPIs por permiso
  const visibleKpis = kpis.filter(kpi => !kpi.claim || isSuperAdmin() || hasPermission(kpi.claim));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-brand" />
            </div>
            Dashboard General
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Resumen operativo y comercial en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Hoy</button>
            <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg shadow-sm">Semana</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Mes</button>
          </div>
          <button className="p-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {visibleKpis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleKpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              {...kpi}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit mx-auto mb-4">
            <LayoutDashboard className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sin acceso a indicadores</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            No tienes permisos suficientes para visualizar los KPIs operativos. Contacta a un administrador.
          </p>
        </div>
      )}

      {/* Secciones de Actividad (Mock) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tendencias Semanales</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CalendarDays className="h-4 w-4" />
              Últimos 7 días
            </div>
          </div>
          <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent" />
            <div className="relative text-center">
              <p className="text-sm text-slate-400 font-medium">Visualización de gráficos en preparación</p>
              <div className="mt-4 flex items-center gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1.5 h-8 bg-brand/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms`, height: `${20 + Math.random() * 40}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alertas Críticas</h2>
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex gap-4">
              <div className="h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-100 italic">Ticket Vencido</p>
                <p className="text-xs text-rose-700/70 dark:text-rose-400">TKT-00452 requiere intervención inmediata.</p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex gap-4">
              <div className="h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100 italic">Desvío Obra</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400">Obra "Sede Norte" superó presupuesto en 15%.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
