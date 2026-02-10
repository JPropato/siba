import type { Material } from '../../types/materiales';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, Package, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';

interface MaterialTableProps {
  materiales: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  isLoading: boolean;
}

export default function MaterialTable({
  materiales,
  onEdit,
  onDelete,
  isLoading,
}: MaterialTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(materiales);
  const actionSheet = useActionSheet<Material>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (materiales.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6 text-brand" />}
        title="Sin materiales"
        description="No se encontraron materiales con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Material>
                label="SKU / Código"
                sortKey="codigoArticulo"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Material>
                label="Material"
                sortKey="nombre"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Material>
                label="Categoría"
                sortKey="categoria"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Presentación
              </th>
              <SortableHeader<Material>
                label="Costo"
                sortKey="precioCosto"
                sortConfig={sortConfig}
                onSort={requestSort}
                className="text-right"
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-center">
                Margen
              </th>
              <SortableHeader<Material>
                label="Precio Venta"
                sortKey="precioVenta"
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
            {items.map((m) => (
              <motion.tr
                key={m.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(m)}
              >
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {m.codigoArticulo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{m.codigoInterno.toString().padStart(4, '0')}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {m.nombre}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {m.descripcion || 'Sin descripción'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-medium">
                    {m.categoria || 'GENERAL'}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col text-xs">
                    <span className="font-medium">{m.presentacion}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Base: {m.unidadMedida}</span>
                      {m.stockMinimo !== null && m.stockMinimo > 0 && (
                        <span
                          className="text-[10px] text-amber-500 font-bold"
                          title={`Stock Mínimo: ${m.stockMinimo}`}
                        >
                          (Min: {m.stockMinimo})
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    ${Number(m.precioCosto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                    {m.porcentajeRentabilidad}%
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    ${Number(m.precioVenta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(m)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(m)}
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
