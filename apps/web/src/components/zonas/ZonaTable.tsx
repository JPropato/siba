import type { Zona } from '../../types/zona';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, Map, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';

interface ZonaTableProps {
  zones: Zona[];
  onEdit: (zone: Zona) => void;
  onDelete: (zone: Zona) => void;
  isLoading: boolean;
}

export default function ZonaTable({ zones, onEdit, onDelete, isLoading }: ZonaTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(zones);
  const actionSheet = useActionSheet<Zona>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <EmptyState
        icon={<Map className="h-6 w-6 text-brand" />}
        title="Sin zonas"
        description="No se encontraron zonas con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Zona>
                label="Código"
                sortKey="codigo"
                sortConfig={sortConfig}
                onSort={requestSort}
                className="w-24"
              />
              <SortableHeader<Zona>
                label="Nombre de Zona"
                sortKey="nombre"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Descripción
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {items.map((zone) => (
              <motion.tr
                key={zone.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(zone)}
              >
                <td className="px-3 py-1.5">
                  <span className="font-mono text-[11px] font-bold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10">
                    #{zone.codigo.toString().padStart(4, '0')}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">
                    {zone.nombre}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {zone.descripcion || (
                      <span className="italic opacity-50 text-[10px]">Sin descripción</span>
                    )}
                  </p>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(zone)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(zone)}
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
        title={actionSheet.selectedItem?.nombre}
        actions={[
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
            variant: 'destructive',
            onClick: () => actionSheet.selectedItem && onDelete(actionSheet.selectedItem),
          },
        ]}
      />
    </div>
  );
}
