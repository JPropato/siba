import { useState, useEffect } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type { DashboardFinanzas } from '../types';
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
} from 'lucide-react';
import { TIPO_CUENTA_CONFIG } from '../types';
import MovimientoDrawer from '../components/MovimientoDrawer';

export default function FinanzasDashboard() {
  const [data, setData] = useState<DashboardFinanzas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await finanzasApi.getDashboard();
      setData(res);
    } catch (error) {
      console.error('Error loading finanzas dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Financiero</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Estado de caja, bancos y movimientos recientes
            </p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Nuevo Movimiento
          </button>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Total */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="h-16 w-16 text-gold" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Saldo Total Consolidado
            </p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(data.saldoTotal)}
            </h3>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
              ARS · Todas las cuentas
            </div>
          </div>

          {/* Ingresos Mes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Ingresos del Mes
              </p>
            </div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {formatCurrency(data.ingresosMes.monto)}
            </h3>
            <div className="mt-2 text-xs text-slate-400">
              {data.ingresosMes.cantidad} operaciones registradas
            </div>
          </div>

          {/* Egresos Mes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Egresos del Mes
              </p>
            </div>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatCurrency(data.egresosMes.monto)}
            </h3>
            <div className="mt-2 text-xs text-slate-400">
              {data.egresosMes.cantidad} operaciones registradas
            </div>
          </div>

          {/* Balance Mes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Balance Neto Mes
              </p>
            </div>
            <h3
              className={`text-2xl font-bold tabular-nums ${data.balanceMes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
            >
              {formatCurrency(data.balanceMes)}
            </h3>
            <div className="mt-2 text-xs text-slate-400">Ingresos - Egresos</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cuentas y Saldos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas y Bancos</h2>
              <button className="text-xs font-semibold text-brand hover:underline">
                Ver todas
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {data.cuentas.map((cuenta, idx) => (
                <div
                  key={cuenta.id}
                  className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx !== data.cuentas.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:scale-110 transition-transform">
                      {/* Fallback icon if none complex is found */}
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
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-gold" />
                Actividad Reciente
              </h2>
              <button className="text-xs font-semibold text-brand hover:underline">
                Ir a movimientos
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Descripción / Cuenta
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {new Date(mov.fechaMovimiento).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                            {mov.descripcion}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {mov.cuenta?.nombre}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
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
                          className="px-4 py-10 text-center text-slate-400 italic text-sm"
                        >
                          No hay movimientos recientes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-brand transition-colors">
                  Ver todos los movimientos
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <MovimientoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          loadDashboard();
          setIsDrawerOpen(false);
        }}
      />
    </>
  );
}
