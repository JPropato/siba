import type { Sede } from '../../types/sedes';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, MapPin, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';

interface SedeTableProps {
  sedes: Sede[];
  onEdit: (sede: Sede) => void;
  onDelete: (sede: Sede) => void;
  isLoading: boolean;
}

export default function SedeTable({ sedes, onEdit, onDelete, isLoading }: SedeTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(sedes);
  const actionSheet = useActionSheet<Sede>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (sedes.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6 text-brand" />}
        title="Sin sedes"
        description="No se encontraron sedes con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Sede>
                label="ID / Cod. Ext"
                sortKey="codigoInterno"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Sede>
                label="Sede / Cliente"
                sortKey="nombre"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">Zona</th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Ubicación
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Contacto
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {items.map((sede) => (
              <motion.tr
                key={sede.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(sede)}
              >
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-mono">
                      #{sede.codigoInterno.toString().padStart(4, '0')}
                    </span>
                    {sede.codigoExterno && (
                      <span className="text-brand font-bold text-[10px]">{sede.codigoExterno}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">
                      {sede.nombre}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase opacity-80">
                      {sede.cliente?.razonSocial}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 uppercase">
                    {sede.zona?.nombre}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                      {sede.direccion}
                    </span>
                    {sede.telefono && (
                      <span className="text-[10px] text-slate-500">{sede.telefono}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      {sede.contactoNombre || (
                        <span className="text-slate-400 italic">No asignado</span>
                      )}
                    </span>
                    {sede.contactoTelefono && (
                      <span className="text-[10px] text-slate-500">{sede.contactoTelefono}</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(sede)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(sede)}
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
