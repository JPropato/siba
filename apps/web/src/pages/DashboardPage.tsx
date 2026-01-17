import Breadcrumbs from '../components/layout/Breadcrumbs';
import EmptyState from '../components/ui/EmptyState';

export function DashboardPage() {
  return (
    <>
      {/* Page Header */}
      <div className="space-y-2">
        <Breadcrumbs items={[{ label: 'Inicio', href: '#' }, { label: 'Dashboard' }]} />
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Dashboard</h2>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-[var(--border)] rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>Últimos 30 días</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20">
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Nuevo Reporte</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <EmptyState
        icon="dashboard_customize"
        title="Personaliza tu Espacio de Trabajo"
        description="Aún no has configurado tus widgets de visualización. Comienza agregando módulos de comercial, finanzas o administración para monitorear el rendimiento corporativo en tiempo real."
        secondaryAction={{
          label: 'Explorar Plantillas',
          onClick: () => console.log('Explorar'),
        }}
        primaryAction={{
          label: 'Agregar Primer Widget',
          icon: 'add_circle',
          onClick: () => console.log('Agregar widget'),
        }}
      />

      {/* KPI Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 dark:opacity-40 grayscale">
        <div className="bg-[var(--surface)] dark:bg-charcoal/30 p-6 rounded-xl border border-[var(--border)] h-32 flex flex-col justify-between shadow-sm">
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">
            Ingresos Proyectados
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">$0.00</div>
        </div>
        <div className="bg-[var(--surface)] dark:bg-charcoal/30 p-6 rounded-xl border border-[var(--border)] h-32 flex flex-col justify-between shadow-sm">
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">
            Margen Operativo
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">0%</div>
        </div>
        <div className="bg-[var(--surface)] dark:bg-charcoal/30 p-6 rounded-xl border border-[var(--border)] h-32 flex flex-col justify-between shadow-sm">
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">
            KPI Global
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">N/A</div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
