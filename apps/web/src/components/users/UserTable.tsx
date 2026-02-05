import type { User } from '../../types/user';
import { useSortableTable } from '../../hooks/useSortableTable';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { SortableHeader } from '../ui/core/SortableHeader';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading: boolean;
}

export default function UserTable({ users, onEdit, onDelete, isLoading }: UserTableProps) {
  const { items, requestSort, sortConfig } = useSortableTable(users);

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No se encontraron usuarios.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <SortableHeader<User>
              label="Usuario"
              sortKey="apellido"
              sortConfig={sortConfig}
              onSort={requestSort}
            />
            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Roles</th>
            <SortableHeader<User>
              label="Último Acceso"
              sortKey="ultimoAcceso"
              sortConfig={sortConfig}
              onSort={requestSort}
            />
            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
          {items.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {user.nombre} {user.apellido}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                </div>
              </td>
              <td className="px-4 py-3">
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
              <td className="px-4 py-3">
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleDateString() : 'Nunca'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10 focus-visible:ring-2 focus-visible:ring-red-500/50"
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
