import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import ZonaTable from '../components/zonas/ZonaTable';
import ZonaDialog from '../components/zonas/ZonaDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useZonas, useCreateZona, useUpdateZona, useDeleteZona } from '../hooks/api/useZonas';
import type { Zona, ZonaFormData } from '../types/zona';

export default function ZonasPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zona | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data: zones = [], isLoading, refetch } = useZonas(debouncedSearch);
  const createZona = useCreateZona();
  const updateZona = useUpdateZona();
  const deleteZona = useDeleteZona();

  const handleCreate = () => {
    setSelectedZone(null);
    setIsModalOpen(true);
  };

  const handleEdit = (zone: Zona) => {
    setSelectedZone(zone);
    setIsModalOpen(true);
  };

  const handleDelete = async (zone: Zona) => {
    if (!window.confirm(`¿Está seguro de eliminar la zona "${zone.nombre}"?`)) return;

    try {
      await deleteZona.mutateAsync(zone.id);
      toast.success('Zona eliminada');
    } catch {
      toast.error('Error al eliminar zona');
    }
  };

  const handleSave = async (data: ZonaFormData) => {
    if (selectedZone) {
      await updateZona.mutateAsync({ id: selectedZone.id, data });
    } else {
      await createZona.mutateAsync(data);
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
              Gestión de Zonas
            </h1>
            <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
              Administre las áreas geográficas para sedes y logística.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <MapPin className="h-5 w-5" />
            NUEVA ZONA
          </button>
        </div>

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>
        </CollapsibleFilters>

        <ZonaTable
          zones={zones}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        <ZonaDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedZone}
        />

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<MapPin className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nueva Zona"
        />
      </div>
    </PullToRefresh>
  );
}
