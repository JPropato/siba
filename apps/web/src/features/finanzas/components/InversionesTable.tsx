import { useSortableTable } from '../../../hooks/useSortableTable';
import { useActionSheet } from '../../../hooks/useActionSheet';
import {
  TrendingUp,
  Loader2,
  Pencil,
  Calendar,
  Percent,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SortableHeader } from '../../../components/ui/core/SortableHeader';
import { MobileActionSheet } from '../../../components/ui/MobileActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { CuentaFinanciera } from '../types';

interface InversionesTableProps {
  inversiones: CuentaFinanciera[];
  onEdit: (inv: CuentaFinanciera) => void;
  isLoading: boolean;
}

const TIPO_INVERSION_LABELS: Record<string, string> = {
  PLAZO_FIJO: 'Plazo Fijo',
  FCI: 'Fondo Común de Inversión',
  CAUCIONES: 'Cauciones',
  OTRO: 'Otra Inversión',
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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpirationStatus = (days: number | null) => {
  if (days === null) return { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Sin venc.' };
  if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Vencida' };
  if (days <= 7) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Por vencer' };
  if (days <= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Próximo' };
  return { color: 'text-green-600', bg: 'bg-green-100', label: 'Vigente' };
};

export default function InversionesTable({
  inversiones,
  onEdit,
  isLoading,
}: InversionesTableProps) {
  const { items: sorted, requestSort, sortConfig } = useSortableTable(inversiones);
  const actionSheet = useActionSheet<CuentaFinanciera>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (inversiones.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-6 w-6 text-brand" />}
        title="Sin inversiones"
        description="No hay inversiones registradas. Creá tu primera inversión para comenzar a trackear rendimientos."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<CuentaFinanciera>
                label="Inversión"
                sortKey="nombre"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                Tipo
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">
                Tasa
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                Vencimiento
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">
                Estado
              </th>
              <SortableHeader<CuentaFinanciera>
                label="Capital"
                sortKey="saldoActual"
                sortConfig={sortConfig}
                onSort={requestSort}
                className="text-right"
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {sorted.map((inv) => {
              const days = getDaysToExpiration(inv.fechaVencimiento);
              const status = getExpirationStatus(days);

              return (
                <motion.tr
                  key={inv.id}
                  className="bg-white dark:bg-slate-950"
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  {...actionSheet.getLongPressHandlers(inv)}
                >
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {inv.nombre}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {inv.banco?.nombreCorto || 'Sin entidad'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 hidden md:table-cell">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {TIPO_INVERSION_LABELS[inv.tipoInversion || ''] || inv.tipoInversion || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-bold text-green-600">
                        {inv.tasaAnual || 0}% TNA
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
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
                  <td className="px-3 py-1.5 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}
                    >
                      {status.label === 'Vencida' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : status.label === 'Vigente' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : null}
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(inv.saldoActual)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Inicial: {formatCurrency(inv.saldoInicial)}
                    </p>
                  </td>
                  <td className="px-2 py-1 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(inv)}
                        className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MobileActionSheet
        open={actionSheet.isOpen}
        onClose={actionSheet.close}
        title={actionSheet.selectedItem?.nombre}
        actions={[
          {
            id: 'edit',
            label: 'Editar',
            icon: <Pencil className="h-5 w-5" />,
            onClick: () => actionSheet.selectedItem && onEdit(actionSheet.selectedItem),
          },
          {
            id: 'renew',
            label: 'Renovar',
            icon: <ArrowUpRight className="h-5 w-5" />,
            onClick: () => {},
          },
        ]}
      />
    </div>
  );
}
