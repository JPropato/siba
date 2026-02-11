import { useSortableTable } from '../../../hooks/useSortableTable';
import { useActionSheet } from '../../../hooks/useActionSheet';
import {
  ArrowLeftRight,
  Loader2,
  Pencil,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  CheckCircle,
  Paperclip,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SortableHeader } from '../../../components/ui/core/SortableHeader';
import { MobileActionSheet } from '../../../components/ui/MobileActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { Movimiento } from '../types';
import {
  ESTADO_MOVIMIENTO_CONFIG,
  MEDIO_PAGO_LABELS,
  CATEGORIA_INGRESO_LABELS,
  CATEGORIA_EGRESO_LABELS,
} from '../types';

interface MovimientosTableProps {
  movimientos: Movimiento[];
  onEdit: (mov: Movimiento) => void;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function MovimientosTable({
  movimientos,
  onEdit,
  isLoading,
}: MovimientosTableProps) {
  const { items: sorted, requestSort, sortConfig } = useSortableTable(movimientos);
  const actionSheet = useActionSheet<Movimiento>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (movimientos.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="h-6 w-6 text-brand" />}
        title="Sin movimientos"
        description="No se encontraron movimientos con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Movimiento>
                label="Fecha"
                sortKey="fechaMovimiento"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Movimiento>
                label="Descripción"
                sortKey="descripcion"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Cuenta / Medio
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                Entidad
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">
                Estado
              </th>
              <SortableHeader<Movimiento>
                label="Monto"
                sortKey="monto"
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
            {sorted.map((mov) => {
              const estado = ESTADO_MOVIMIENTO_CONFIG[mov.estado];
              const categoriaLabel =
                mov.tipo === 'INGRESO'
                  ? CATEGORIA_INGRESO_LABELS[mov.categoriaIngreso!]
                  : CATEGORIA_EGRESO_LABELS[mov.categoriaEgreso!];

              return (
                <motion.tr
                  key={mov.id}
                  className="bg-white dark:bg-slate-950"
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  {...actionSheet.getLongPressHandlers(mov)}
                >
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white text-xs">
                        {formatDate(mov.fechaMovimiento)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white line-clamp-1">
                        {mov.descripcion}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight font-bold">
                          {categoriaLabel}
                        </span>
                        {mov.comprobante && (
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
                            #{mov.comprobante}
                          </span>
                        )}
                        {mov.comprobanteUrl && (
                          <a
                            href={mov.comprobanteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:text-brand/80 transition-colors"
                            title="Ver comprobante adjunto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Paperclip className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        {mov.cuenta?.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {MEDIO_PAGO_LABELS[mov.medioPago]}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 hidden lg:table-cell">
                    {mov.cliente ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand">
                          {mov.cliente.razonSocial}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">
                          Cliente
                        </span>
                      </div>
                    ) : mov.obra ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand">{mov.obra.codigo}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Obra</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 hidden sm:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${estado.color} ${estado.bgColor} border-current/20`}
                    >
                      {estado.label}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
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
                  <td className="px-2 py-1 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(mov)}
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
        title={actionSheet.selectedItem?.descripcion}
        actions={[
          {
            id: 'edit',
            label: 'Editar',
            icon: <Pencil className="h-5 w-5" />,
            onClick: () => actionSheet.selectedItem && onEdit(actionSheet.selectedItem),
          },
          {
            id: 'confirm',
            label: 'Confirmar',
            icon: <CheckCircle className="h-5 w-5" />,
            onClick: () => {},
          },
          {
            id: 'void',
            label: 'Anular',
            icon: <XCircle className="h-5 w-5" />,
            variant: 'destructive' as const,
            onClick: () => {},
          },
        ]}
      />
    </div>
  );
}
