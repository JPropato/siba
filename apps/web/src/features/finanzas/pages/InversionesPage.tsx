import { useState, useEffect } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaFinanciera } from '../types';
import {
  TrendingUp,
  Plus,
  Calendar,
  Percent,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  PiggyBank,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import CuentaDrawer from '../components/CuentaDrawer';

const TIPO_INVERSION_LABELS: Record<string, string> = {
  PLAZO_FIJO: 'Plazo Fijo',
  FCI: 'Fondo Común de Inversión',
  CAUCIONES: 'Cauciones',
  OTRO: 'Otra Inversión',
};

export default function InversionesPage() {
  const [inversiones, setInversiones] = useState<CuentaFinanciera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInvertido, setTotalInvertido] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInversion, setSelectedInversion] = useState<CuentaFinanciera | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    loadInversiones();
  }, []);

  const loadInversiones = async () => {
    try {
      setIsLoading(true);
      const cuentas = await finanzasApi.getCuentas();
      const inversionesFiltradas = cuentas.filter((c) => c.tipo === 'INVERSION');
      setInversiones(inversionesFiltradas);
      const total = inversionesFiltradas.reduce((acc, c) => acc + Number(c.saldoActual), 0);
      setTotalInvertido(total);
    } catch (error) {
      console.error('Error loading inversiones:', error);
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

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysToExpiration = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const today = new Date();
    const expiration = new Date(dateStr);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (days: number | null) => {
    if (days === null) return { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Sin venc.' };
    if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Vencida' };
    if (days <= 7) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Por vencer' };
    if (days <= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Próximo' };
    return { color: 'text-green-600', bg: 'bg-green-100', label: 'Vigente' };
  };

  const handleNewInversion = () => {
    setSelectedInversion(null);
    setIsDrawerOpen(true);
  };

  const handleEditInversion = (inv: CuentaFinanciera) => {
    setSelectedInversion(inv);
    setIsDrawerOpen(true);
    setMenuOpenId(null);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-indigo-500" />
              Inversiones
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Plazos fijos, FCIs, cauciones y otras inversiones
            </p>
          </div>
          <button
            onClick={handleNewInversion}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nueva Inversión
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Invertido */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <PiggyBank className="h-20 w-20" />
            </div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">
              Capital Total Invertido
            </p>
            <h2 className="text-3xl font-extrabold tabular-nums">
              {formatCurrency(totalInvertido)}
            </h2>
            <p className="text-indigo-200 text-sm mt-2">{inversiones.length} inversiones activas</p>
          </div>

          {/* Próximos Vencimientos */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Próximos Vencimientos
              </p>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {
                inversiones.filter((i) => {
                  const days = getDaysToExpiration(i.fechaVencimiento);
                  return days !== null && days >= 0 && days <= 30;
                }).length
              }
            </div>
            <p className="text-xs text-slate-400 mt-1">En los próximos 30 días</p>
          </div>

          {/* Rendimiento Estimado */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tasa Promedio
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {inversiones.length > 0
                ? (
                    inversiones.reduce((acc, i) => acc + Number(i.tasaAnual || 0), 0) /
                    inversiones.length
                  ).toFixed(1)
                : '0'}
              % TNA
            </div>
            <p className="text-xs text-slate-400 mt-1">Tasa nominal anual promedio</p>
          </div>
        </div>

        {/* Inversiones List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Detalle de Inversiones</h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-sm text-slate-400 mt-3">Cargando inversiones...</p>
            </div>
          ) : inversiones.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay inversiones registradas</p>
              <p className="text-sm text-slate-400 mt-1">
                Creá tu primera inversión para comenzar a trackear rendimientos
              </p>
              <button
                onClick={handleNewInversion}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700"
              >
                Crear Inversión
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Inversión
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tasa
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                      Capital
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inversiones.map((inv) => {
                    const days = getDaysToExpiration(inv.fechaVencimiento);
                    const status = getExpirationStatus(days);

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {inv.nombre}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {inv.banco?.nombreCorto || 'Sin entidad'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {TIPO_INVERSION_LABELS[inv.tipoInversion || ''] ||
                              inv.tipoInversion ||
                              '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Percent className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-bold text-green-600">
                              {inv.tasaAnual || 0}% TNA
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {formatDate(inv.fechaVencimiento)}
                            </span>
                          </div>
                          {days !== null && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {days > 0
                                ? `${days} días restantes`
                                : days === 0
                                  ? 'Vence hoy'
                                  : `Venció hace ${Math.abs(days)} días`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}
                          >
                            {status.label === 'Vencida' ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : status.label === 'Vigente' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : null}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(inv.saldoActual)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Inicial: {formatCurrency(inv.saldoInicial)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === inv.id ? null : inv.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuOpenId === inv.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                  <button
                                    onClick={() => handleEditInversion(inv)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                  </button>
                                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-green-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                    Renovar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer para crear/editar inversiones */}
      <CuentaDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedInversion(null);
        }}
        cuenta={selectedInversion}
        onSuccess={() => {
          loadInversiones();
          setIsDrawerOpen(false);
          setSelectedInversion(null);
        }}
      />
    </>
  );
}
