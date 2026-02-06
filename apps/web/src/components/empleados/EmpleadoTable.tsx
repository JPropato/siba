import type { Empleado } from '../../types/empleados';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';

interface EmpleadoTableProps {
  empleados: Empleado[];
  onEdit: (empleado: Empleado) => void;
  onDelete: (empleado: Empleado) => void;
  isLoading: boolean;
}

export default function EmpleadoTable({
  empleados,
  onEdit,
  onDelete,
  isLoading,
}: EmpleadoTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(empleados);
  const actionSheet = useActionSheet<Empleado>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (empleados.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No se encontraron empleados.</p>
      </div>
    );
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'GERENTE':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'ADMINISTRATIVO':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'TECNICO':
      default:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Empleado>
                label="Empleado"
                sortKey="apellido"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Contacto
              </th>
              <SortableHeader<Empleado>
                label="Tipo"
                sortKey="tipo"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Zona Asignada
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {items.map((e) => (
              <motion.tr
                key={e.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                  scale: 1.005,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(e)}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {e.apellido}, {e.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ingreso: {new Date(e.inicioRelacionLaboral).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col text-[11px]">
                    {e.email && (
                      <span className="text-slate-600 dark:text-slate-300">{e.email}</span>
                    )}
                    {e.telefono && <span className="text-slate-400">{e.telefono}</span>}
                    {!e.email && !e.telefono && (
                      <span className="italic text-slate-400">Sin datos</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTipoBadge(e.tipo)}`}
                    >
                      {e.tipo}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {e.contratacion?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {e.zona ? (
                    <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold border border-brand/20 uppercase">
                      {e.zona.nombre}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No asignada</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => onDelete(e)}
                      className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 focus-visible:ring-2 focus-visible:ring-red-500/50"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-[18px] w-[18px]" />
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
            ? `${actionSheet.selectedItem.apellido}, ${actionSheet.selectedItem.nombre}`
            : undefined
        }
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
