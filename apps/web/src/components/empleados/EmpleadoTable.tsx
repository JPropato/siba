import type { Empleado } from '../../types/empleados';
import {
  ESTADO_EMPLEADO_CONFIG,
  TIPO_EMPLEADO_CONFIG,
  CATEGORIA_LABORAL_CONFIG,
  TIPO_CONTRATO_CONFIG,
} from '../../types/empleados';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, Pencil, Trash2, Users, Star, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';

interface EmpleadoTableProps {
  empleados: Empleado[];
  onEdit: (empleado: Empleado) => void;
  onDelete: (empleado: Empleado) => void;
  isLoading: boolean;
}

const ESTADO_BADGE_CLASSES: Record<string, string> = {
  green:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  amber:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};

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
      <EmptyState
        icon={<Users className="h-6 w-6 text-brand" />}
        title="Sin empleados"
        description="No se encontraron empleados con los filtros aplicados."
      />
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

  function getAPIndicator(e: Empleado) {
    const seguro = e.segurosAP?.[0];
    if (!seguro) {
      return <span className="h-2 w-2 rounded-full bg-red-400" title="Sin cobertura" />;
    }
    if (seguro.estado === 'ACTIVO') {
      return <span className="h-2 w-2 rounded-full bg-green-400" title="Cobertura activa" />;
    }
    return <span className="h-2 w-2 rounded-full bg-amber-400" title="Pendiente" />;
  }

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
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Contacto
              </th>
              <SortableHeader<Empleado>
                label="Laboral"
                sortKey="tipo"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">
                Estado
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                Zona
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell text-center">
                <span title="Seguro AP">
                  <ShieldCheck className="h-4 w-4 inline" />
                </span>
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
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
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(e)}
              >
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {e.foto ? (
                        <img
                          src={e.foto}
                          alt={`${e.nombre} ${e.apellido}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {e.apellido}, {e.nombre}
                        </span>
                        {e.esReferente && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {e.legajo && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Legajo {e.legajo}
                        </span>
                      )}
                      {e.puesto && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {e.puesto}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        Ingreso: {new Date(e.inicioRelacionLaboral).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5">
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
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTipoBadge(e.tipo)}`}
                    >
                      {TIPO_EMPLEADO_CONFIG[e.tipo]?.label || e.tipo}
                    </span>
                    {e.categoriaLaboral && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {CATEGORIA_LABORAL_CONFIG[e.categoriaLaboral]?.label}
                      </span>
                    )}
                    {e.tipoContrato && (
                      <span className="text-[10px] text-slate-400">
                        {TIPO_CONTRATO_CONFIG[e.tipoContrato]?.label}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5 hidden sm:table-cell">
                  {e.estado && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ESTADO_BADGE_CLASSES[ESTADO_EMPLEADO_CONFIG[e.estado]?.color] || ESTADO_BADGE_CLASSES.green}`}
                    >
                      {ESTADO_EMPLEADO_CONFIG[e.estado]?.label || e.estado}
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 hidden md:table-cell">
                  {e.zona ? (
                    <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold border border-brand/20 uppercase">
                      {e.zona.nombre}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No asignada</span>
                  )}
                </td>
                <td className="px-3 py-1.5 hidden md:table-cell text-center">
                  {getAPIndicator(e)}
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(e)}
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
