import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Building2, Loader2, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';
import { EmptyState } from '../ui/EmptyState';
import type { Cliente } from '../../types/client';

interface ClientTableProps {
  clients: Cliente[];
  onEdit: (client: Cliente) => void;
  onDelete: (client: Cliente) => void;
  isLoading: boolean;
}

export default function ClientTable({ clients, onEdit, onDelete, isLoading }: ClientTableProps) {
  const { items: sortedClients, requestSort, sortConfig } = useSortableTable(clients);
  const actionSheet = useActionSheet<Cliente>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6 text-brand" />}
        title="Sin clientes"
        description="No se encontraron clientes con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<Cliente>
                label="Cód."
                sortKey="codigo"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Cliente>
                label="Razón Social"
                sortKey="razonSocial"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader<Cliente>
                label="CUIT / ID Fiscal"
                sortKey="cuit"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Contacto
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {sortedClients.map((client) => (
              <motion.tr
                key={client.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(client)}
              >
                <td className="px-3 py-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold tracking-wider border border-brand/20">
                    #{client.codigo?.toString().padStart(4, '0') || '----'}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {client.razonSocial}
                    </span>
                    {client.direccionFiscal && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {client.direccionFiscal}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  {client.cuit ? (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {client.cuit}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">No informado</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-col gap-0.5">
                    {client.email && (
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {client.email}
                      </span>
                    )}
                    {client.telefono && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-500">
                        {client.telefono}
                      </span>
                    )}
                    {!client.email && !client.telefono && (
                      <span className="text-slate-400 italic text-[11px]">Sin contacto</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(client)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(client)}
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
        title={actionSheet.selectedItem?.razonSocial}
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
