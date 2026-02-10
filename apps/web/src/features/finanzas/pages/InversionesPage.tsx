import { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { TrendingUp, Plus, Clock, Percent, PiggyBank, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { FloatingActionButton } from '../../../components/layout/FloatingActionButton';
import type { CuentaFinanciera } from '../types';
import { useCuentas } from '../hooks/useCuentas';
import InversionesTable from '../components/InversionesTable';

const CuentaDrawer = lazy(() => import('../components/CuentaDrawer'));

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const getDaysToExpiration = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const today = new Date();
  const expiration = new Date(dateStr);
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function InversionesPage() {
  const { data: cuentas = [], isLoading, refetch } = useCuentas();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInversion, setSelectedInversion] = useState<CuentaFinanciera | null>(null);

  const inversiones = useMemo(() => cuentas.filter((c) => c.tipo === 'INVERSION'), [cuentas]);
  const totalInvertido = useMemo(
    () => inversiones.reduce((acc, c) => acc + Number(c.saldoActual), 0),
    [inversiones]
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCreate = () => {
    setSelectedInversion(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (inv: CuentaFinanciera) => {
    setSelectedInversion(inv);
    setIsDrawerOpen(true);
  };

  const proxVencimientos = inversiones.filter((i) => {
    const days = getDaysToExpiration(i.fechaVencimiento);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const tasaPromedio =
    inversiones.length > 0
      ? (
          inversiones.reduce((acc, i) => acc + Number(i.tasaAnual || 0), 0) / inversiones.length
        ).toFixed(1)
      : '0';

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<TrendingUp className="h-5 w-5" />}
          breadcrumb={['Finanzas', 'Inversiones']}
          title="Inversiones"
          subtitle="Plazos fijos, FCIs, cauciones y otras inversiones"
          count={inversiones.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nueva Inversión
            </button>
          }
        />

        {/* Summary Cards */}
        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Invertido */}
              <div className="bg-brand text-white p-5 rounded-lg shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <PiggyBank className="h-20 w-20" />
                </div>
                <p className="text-brand-light text-[10px] font-bold uppercase tracking-widest mb-1">
                  Capital Total Invertido
                </p>
                <h2 className="text-2xl font-extrabold tabular-nums">
                  {formatCurrency(totalInvertido)}
                </h2>
                <p className="text-brand-light text-xs mt-2">
                  {inversiones.length} inversiones activas
                </p>
              </div>

              {/* Próximos Vencimientos */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Próximos Vencimientos
                  </p>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {proxVencimientos}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">En los próximos 30 días</p>
              </div>

              {/* Tasa Promedio */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tasa Promedio
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {tasaPromedio}% TNA
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Tasa nominal anual promedio</p>
              </div>
            </div>

            {/* Inversiones Table */}
            <InversionesTable inversiones={inversiones} onEdit={handleEdit} isLoading={isLoading} />
          </>
        )}

        {/* Drawer - Lazy loaded */}
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <CuentaDrawer
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedInversion(null);
              }}
              cuenta={selectedInversion}
              onSuccess={() => {
                setIsDrawerOpen(false);
                setSelectedInversion(null);
              }}
            />
          </Suspense>
        )}

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nueva Inversión"
        />
      </div>
    </PullToRefresh>
  );
}
