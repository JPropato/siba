import type { TarjetaPrecargable } from '../types';
import { TIPO_TARJETA_CONFIG, ESTADO_TARJETA_CONFIG } from '../types';
import { useSortableTable } from '../../../hooks/useSortableTable';
import { useActionSheet } from '../../../hooks/useActionSheet';
import { CreditCard, Loader2, Pencil, Trash2, Eye, ChevronRight } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { motion } from 'framer-motion';
import { SortableHeader } from '../../../components/ui/core/SortableHeader';
import { MobileActionSheet } from '../../../components/ui/MobileActionSheet';

interface TarjetaTableProps {
  tarjetas: TarjetaPrecargable[];
  onEdit: (tarjeta: TarjetaPrecargable) => void;
  onDelete: (tarjeta: TarjetaPrecargable) => void;
  onView?: (tarjeta: TarjetaPrecargable) => void;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function TarjetaTable({
  tarjetas,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: TarjetaTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(tarjetas);
  const actionSheet = useActionSheet<TarjetaPrecargable>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (tarjetas.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard className="h-6 w-6 text-brand" />}
        title="Sin tarjetas"
        description="No se encontraron tarjetas con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<TarjetaPrecargable>
                label="Alias / Nro"
                sortKey="alias"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<TarjetaPrecargable>
                label="Tipo"
                sortKey="tipo"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<TarjetaPrecargable>
                label="Titular"
                sortKey="empleado"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                Banco
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Saldo
              </th>
              <SortableHeader<TarjetaPrecargable>
                label="Estado"
                sortKey="estado"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {items.map((t) => (
              <motion.tr
                key={t.id}
                onClick={() => onView?.(t)}
                className={`bg-white dark:bg-slate-950 ${onView ? 'cursor-pointer' : ''}`}
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(t)}
              >
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-1">
                    {t.alias ? (
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {t.alias}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin alias</span>
                    )}
                    {t.numeroTarjeta && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {t.numeroTarjeta}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      TIPO_TARJETA_CONFIG[t.tipo].color
                    }`}
                  >
                    {TIPO_TARJETA_CONFIG[t.tipo].label}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {t.empleado.apellido}, {t.empleado.nombre}
                    </span>
                    {t.empleado.esReferente && (
                      <span className="text-[10px] text-brand font-bold">Referente</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5 hidden lg:table-cell">
                  {t.banco ? (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {t.banco.nombreCorto}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Sin banco</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right hidden sm:table-cell">
                  <span
                    className={`font-bold text-xs font-mono ${
                      t.cuentaFinanciera.saldoActual >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(t.cuentaFinanciera.saldoActual)}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      ESTADO_TARJETA_CONFIG[t.estado].color
                    }`}
                  >
                    {ESTADO_TARJETA_CONFIG[t.estado].label}
                  </span>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(t);
                        }}
                        className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                        title="Ver detalles"
                        aria-label="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(t);
                      }}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t);
                      }}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 focus-visible:ring-2 focus-visible:ring-red-500/50"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileActionSheet
        open={actionSheet.isOpen}
        onClose={actionSheet.close}
        title={
          actionSheet.selectedItem
            ? `${actionSheet.selectedItem.alias || 'Tarjeta'} - ${actionSheet.selectedItem.empleado.apellido}`
            : undefined
        }
        actions={[
          ...(onView
            ? [
                {
                  id: 'view',
                  label: 'Ver detalle',
                  icon: <ChevronRight className="h-5 w-5" />,
                  onClick: () => actionSheet.selectedItem && onView(actionSheet.selectedItem),
                },
              ]
            : []),
          {
            id: 'edit',
            label: 'Editar',
            icon: <Pencil className="h-5 w-5" />,
            onClick: () => actionSheet.selectedItem && onEdit(actionSheet.selectedItem),
          },
          {
            id: 'delete',
            label: 'Eliminar',
            icon: <Trash2 className="h-5 w-5" />,
            variant: 'destructive' as const,
            onClick: () => actionSheet.selectedItem && onDelete(actionSheet.selectedItem),
          },
        ]}
      />
    </div>
  );
}
