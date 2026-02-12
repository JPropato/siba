import { useState, useEffect, useCallback } from 'react';
import { Search, Building2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import SedeTable from '../components/sedes/SedeTable';
import SedeDialog from '../components/sedes/SedeDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useSedes, useCreateSede, useUpdateSede, useDeleteSede } from '../hooks/api/useSedes';
import type { Sede, SedeFormData } from '../types/sedes';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../hooks/useConfirm';

export default function SedesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data, isLoading, refetch } = useSedes(debouncedSearch, page);
  const sedes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const createSede = useCreateSede();
  const updateSede = useUpdateSede();
  const deleteSede = useDeleteSede();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleCreate = () => {
    setSelectedSede(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setIsModalOpen(true);
  };

  const handleDelete = async (sede: Sede) => {
    const ok = await confirm({
      title: 'Eliminar sede',
      message: `¿Está seguro de eliminar la sede "${sede.nombre}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteSede.mutateAsync(sede.id);
      toast.success('Sede eliminada');
    } catch {
      toast.error('Error al eliminar sede');
    }
  };

  const handleSave = async (data: SedeFormData) => {
    if (selectedSede) {
      await updateSede.mutateAsync({ id: selectedSede.id, data });
    } else {
      await createSede.mutateAsync(data);
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
          icon={<Building2 className="h-5 w-5" />}
          breadcrumb={['Administración', 'Sedes']}
          title="Sedes"
          subtitle="Sucursales y puntos de servicio"
          count={sedes.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Building2 className="h-4 w-4" />
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
              placeholder="Buscar por nombre, dirección o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </CollapsibleFilters>

        <SedeTable
          sedes={sedes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <SedeDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedSede}
        />

        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
