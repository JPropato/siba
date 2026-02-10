import type { User } from '../../types/user';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useActionSheet } from '../../hooks/useActionSheet';
import { Loader2, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { SortableHeader } from '../ui/core/SortableHeader';
import { MobileActionSheet } from '../ui/MobileActionSheet';
import { EmptyState } from '../ui/EmptyState';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading: boolean;
}

export default function UserTable({ users, onEdit, onDelete, isLoading }: UserTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(users);
  const actionSheet = useActionSheet<User>();

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-6 w-6 text-brand" />}
        title="Sin usuarios"
        description="No se encontraron usuarios con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<User>
                label="Usuario"
                sortKey="apellido"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">Roles</th>
              <SortableHeader<User>
                label="Último Acceso"
                sortKey="ultimoAcceso"
                sortConfig={sortConfig}
                onSort={requestSort}
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {items.map((user) => (
              <motion.tr
                key={user.id}
                className="bg-white dark:bg-slate-950"
                whileHover={{
                  backgroundColor: 'rgba(248, 250, 252, 1)',
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                {...actionSheet.getLongPressHandlers(user)}
              >
                <td className="px-3 py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {user.nombre} {user.apellido}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((rol) => (
                      <span
                        key={rol}
                        className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] uppercase font-bold tracking-wider border border-brand/20"
                      >
                        {rol}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs">
                    {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleDateString() : 'Nunca'}
                  </span>
                </td>
                <td className="px-2 py-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
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
            ? `${actionSheet.selectedItem.nombre} ${actionSheet.selectedItem.apellido}`
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
