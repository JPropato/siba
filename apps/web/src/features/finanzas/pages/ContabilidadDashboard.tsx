import { useState, useCallback } from 'react';
import {
  BarChart3,
  ChevronRight,
  ChevronDown,
  Loader2,
  Scale,
  TrendingUp,
  TrendingDown,
  Landmark,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { useBalanceContable } from '../hooks/useBalanceContable';
import type { CuentaConSaldo, GrupoContable } from '../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

// ── CuentaTree: renderiza cuentas jerárquicas ────────────────

function CuentaRow({ cuenta, depth = 0 }: { cuenta: CuentaConSaldo; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cuenta.hijos && cuenta.hijos.length > 0;
  const isParent = !cuenta.imputable || hasChildren;

  return (
    <>
      <tr
        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isParent ? 'font-semibold' : ''}`}
      >
        <td className="px-3 py-2">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 mr-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 mr-1" />
            )}
            <span className="text-[10px] text-slate-400 font-mono mr-2 tabular-nums">
              {cuenta.codigo}
            </span>
            <span
              className={`text-sm ${isParent ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {cuenta.nombre}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-right whitespace-nowrap">
          <span
            className={`text-sm tabular-nums ${isParent ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            {formatCurrency(cuenta.saldo)}
          </span>
        </td>
      </tr>
      {expanded &&
        hasChildren &&
        cuenta.hijos!.map((hijo) => <CuentaRow key={hijo.id} cuenta={hijo} depth={depth + 1} />)}
    </>
  );
}

function GrupoPanel({
  titulo,
  grupo,
  colorClase,
}: {
  titulo: string;
  grupo: GrupoContable;
  colorClase: string;
}) {
  if (grupo.cuentas.length === 0) {
    return (
      <div className="py-4 px-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${colorClase}`}>{titulo}</h3>
          <span className="text-sm font-bold text-slate-400 tabular-nums">{formatCurrency(0)}</span>
        </div>
        <p className="text-xs text-slate-400 italic">Sin movimientos registrados</p>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${colorClase}`}
            >
              {titulo}
            </th>
            <th className="px-3 py-2 text-right">
              <span className={`text-sm font-bold tabular-nums ${colorClase}`}>
                {formatCurrency(grupo.total)}
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {grupo.cuentas.map((cuenta) => (
            <CuentaRow key={cuenta.id} cuenta={cuenta} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function ContabilidadDashboard() {
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const { data, isLoading, refetch } = useBalanceContable(fechaHasta || undefined);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      label: 'Activo',
      value: data.activo.total,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Pasivo',
      value: Math.abs(data.pasivo.total),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Patrimonio Neto',
      value: Math.abs(data.patrimonio.total),
      icon: Landmark,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Resultado del Período',
      value: data.resultadoPeriodo,
      icon: Scale,
      color:
        data.resultadoPeriodo >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-orange-600 dark:text-orange-400',
      bg:
        data.resultadoPeriodo >= 0
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<BarChart3 className="h-5 w-5" />}
          breadcrumb={['Contabilidad', 'Dashboard']}
          title="Situación Contable"
          subtitle="Estado patrimonial y resultados del período"
          action={
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">A fecha:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          }
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {m.label}
                </p>
              </div>
              <h3 className={`text-xl font-bold tabular-nums ${m.color}`}>
                {formatCurrency(m.value)}
              </h3>
            </div>
          ))}
        </div>

        {/* Balance General */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Balance General</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Activo = Pasivo + Patrimonio Neto</p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <GrupoPanel
              titulo="Activo"
              grupo={data.activo}
              colorClase="text-blue-600 dark:text-blue-400"
            />
            <GrupoPanel
              titulo="Pasivo"
              grupo={data.pasivo}
              colorClase="text-red-600 dark:text-red-400"
            />
            <GrupoPanel
              titulo="Patrimonio Neto"
              grupo={data.patrimonio}
              colorClase="text-purple-600 dark:text-purple-400"
            />
          </div>

          {/* Ecuación contable */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">
                Ecuación Contable: A = P + PN + Resultado
              </span>
              <span
                className={`font-bold ${data.ecuacionContable.balanceado ? 'text-green-600' : 'text-orange-600'}`}
              >
                {data.ecuacionContable.balanceado ? 'Balanceado' : 'Desbalanceado'}
              </span>
            </div>
          </div>
        </div>

        {/* Estado de Resultados */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Estado de Resultados
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Ingresos - Gastos = Resultado</p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <GrupoPanel
              titulo="Ingresos"
              grupo={data.ingresos}
              colorClase="text-green-600 dark:text-green-400"
            />
            <GrupoPanel
              titulo="Gastos"
              grupo={data.gastos}
              colorClase="text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* Resultado */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-300 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Resultado del Período
              </span>
              <span
                className={`text-lg font-bold tabular-nums ${data.resultadoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(data.resultadoPeriodo)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
