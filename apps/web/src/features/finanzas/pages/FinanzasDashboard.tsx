import { lazy, Suspense, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  History,
  Plus,
  ArrowRight,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { TIPO_CUENTA_CONFIG } from '../types';
import { useFinanzasDashboard } from '../hooks/useFinanzasDashboard';

const MovimientoDrawer = lazy(() => import('../components/MovimientoDrawer'));

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export default function FinanzasDashboard() {
  const { data, isLoading, refetch } = useFinanzasDashboard();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCreate = () => setIsDrawerOpen(true);

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<BarChart3 className="h-5 w-5" />}
          breadcrumb={['Tesorería', 'Dashboard']}
          title="Panel Financiero"
          subtitle="Estado de caja, bancos y movimientos recientes"
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </button>
          }
        />

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Total */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="h-16 w-16 text-brand" />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo Total Consolidado
            </p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(data.saldoTotal)}
            </h3>
            <div className="mt-3 flex items-center text-[10px] font-medium text-slate-400">
              ARS · Todas las cuentas
            </div>
          </div>

          {/* Ingresos Mes */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ingresos del Mes
              </p>
            </div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {formatCurrency(data.ingresosMes.monto)}
            </h3>
            <div className="mt-2 text-[10px] text-slate-400">
              {data.ingresosMes.cantidad} operaciones registradas
            </div>
          </div>

          {/* Egresos Mes */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Egresos del Mes
              </p>
            </div>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatCurrency(data.egresosMes.monto)}
            </h3>
            <div className="mt-2 text-[10px] text-slate-400">
              {data.egresosMes.cantidad} operaciones registradas
            </div>
          </div>

          {/* Balance Mes */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Balance Neto Mes
              </p>
            </div>
            <h3
              className={`text-2xl font-bold tabular-nums ${data.balanceMes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
            >
              {formatCurrency(data.balanceMes)}
            </h3>
            <div className="mt-2 text-[10px] text-slate-400">Ingresos - Egresos</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cuentas y Saldos */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cuentas y Bancos</h2>
              <button
                onClick={() => navigate('/dashboard/finanzas/cuentas')}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              {data.cuentas.map((cuenta, idx) => (
                <div
                  key={cuenta.id}
                  className={`p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx !== data.cuentas.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {cuenta.nombre}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                        {cuenta.banco || TIPO_CUENTA_CONFIG[cuenta.tipo]?.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(cuenta.saldoActual)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos Movimientos */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-brand" />
                Actividad Reciente
              </h2>
              <button
                onClick={() => navigate('/dashboard/finanzas/movimientos')}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Ir a movimientos
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Descripción / Cuenta
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.ultimosMovimientos.map((mov) => (
                      <tr
                        key={mov.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {new Date(mov.fechaMovimiento).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                            {mov.descripcion}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                            <span>{mov.cuenta?.nombre}</span>
                            {mov.cuentaContable && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span>{mov.cuentaContable.nombre}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div
                            className={`text-sm font-bold flex items-center justify-end gap-1 ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {mov.tipo === 'INGRESO' ? '+' : '-'} {formatCurrency(mov.monto)}
                            {mov.tipo === 'INGRESO' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.ultimosMovimientos.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-10 text-center text-slate-400 italic text-sm"
                        >
                          No hay movimientos recientes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => navigate('/dashboard/finanzas/movimientos')}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-brand transition-colors"
                >
                  Ver todos los movimientos
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer - Lazy loaded */}
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <MovimientoDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onSuccess={() => {
                setIsDrawerOpen(false);
              }}
            />
          </Suspense>
        )}
      </div>
    </PullToRefresh>
  );
}
