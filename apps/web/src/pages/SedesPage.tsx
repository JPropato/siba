import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import SedeTable from '../components/sedes/SedeTable';
import SedeDialog from '../components/sedes/SedeDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useSedes, useCreateSede, useUpdateSede, useDeleteSede } from '../hooks/api/useSedes';
import type { Sede, SedeFormData } from '../types/sedes';

export default function SedesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data: sedes = [], isLoading, refetch } = useSedes(debouncedSearch);
  const createSede = useCreateSede();
  const updateSede = useUpdateSede();
  const deleteSede = useDeleteSede();

  const handleCreate = () => {
    setSelectedSede(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setIsModalOpen(true);
  };

  const handleDelete = async (sede: Sede) => {
    if (!window.confirm(`¿Está seguro de eliminar la sede "${sede.nombre}"?`)) return;

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
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-fluid-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gestión de Sedes
            </h1>
            <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
              Administre las sucursales y puntos de servicio de sus clientes.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Building2 className="h-5 w-5" />
            NUEVA SEDE
          </button>
        </div>

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

        <div className="space-y-4">
          <SedeTable
            sedes={sedes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>

        <SedeDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedSede}
        />

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Building2 className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nueva Sede"
        />
      </div>
    </PullToRefresh>
  );
}
