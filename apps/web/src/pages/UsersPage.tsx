import { useState, useEffect, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import UserTable from '../components/users/UserTable';
import UserDialog from '../components/users/UserDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/api/useUsers';
import type { User } from '../types/user';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data: users = [], isLoading, refetch } = useUsers(debouncedSearch);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) return;

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('Usuario eliminado');
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleSave = async (data: {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    rolId: number;
  }) => {
    if (selectedUser) {
      await updateUser.mutateAsync({ id: selectedUser.id, data });
    } else {
      await createUser.mutateAsync(data);
    }
  };

  // Handler para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-fluid-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gestión de Usuarios
            </h1>
            <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
              Administre el acceso y roles del personal.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            NUEVO USUARIO
          </button>
        </div>

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>
        </CollapsibleFilters>

        {/* Table */}
        <UserTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        {/* Dialog */}
        <UserDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedUser}
        />

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nuevo Usuario"
        />
      </div>
    </PullToRefresh>
  );
}
