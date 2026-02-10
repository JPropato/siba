import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import EmpleadoTable from '../components/empleados/EmpleadoTable';
import EmpleadoDialog from '../components/empleados/EmpleadoDialog';
import {
  useEmpleados,
  useCreateEmpleado,
  useUpdateEmpleado,
  useDeleteEmpleado,
} from '../hooks/api/useEmpleados';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import type { Empleado, EmpleadoFormData } from '../types/empleados';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../hooks/useConfirm';

export default function EmpleadosPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data, isLoading, refetch } = useEmpleados(debouncedSearch, page);
  const empleados = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const createEmpleado = useCreateEmpleado();
  const updateEmpleado = useUpdateEmpleado();
  const deleteEmpleado = useDeleteEmpleado();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleCreate = () => {
    setSelectedEmpleado(null);
    setIsModalOpen(true);
  };

  const handleEdit = (e: Empleado) => {
    setSelectedEmpleado(e);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: Empleado) => {
    const ok = await confirm({
      title: 'Eliminar empleado',
      message: `¿Está seguro de eliminar al empleado "${e.apellido}, ${e.nombre}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteEmpleado.mutateAsync(e.id);
      toast.success('Empleado eliminado');
    } catch {
      toast.error('Error al eliminar empleado');
    }
  };

  const handleSave = async (data: EmpleadoFormData) => {
    if (selectedEmpleado) {
      await updateEmpleado.mutateAsync({ id: selectedEmpleado.id, data });
    } else {
      await createEmpleado.mutateAsync(data);
    }
  };

  // Handler para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Users className="h-5 w-5" />}
          breadcrumb={['RRHH', 'Empleados']}
          title="Empleados"
          subtitle="Personal y asignaciones"
          count={empleados.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo
            </button>
          }
        />

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </CollapsibleFilters>

        <EmpleadoTable
          empleados={empleados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <EmpleadoDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedEmpleado}
        />

        {ConfirmDialog}

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<UserPlus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nuevo Empleado"
        />
      </div>
    </PullToRefresh>
  );
}
