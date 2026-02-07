import { useState, useEffect } from 'react';
import { Search, Truck } from 'lucide-react';
import { toast } from 'sonner';
import VehiculoTable from '../components/vehiculos/VehiculoTable';
import VehiculoDialog from '../components/vehiculos/VehiculoDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import {
  useVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
} from '../hooks/api/useVehiculos';
import type { Vehiculo, VehiculoFormData } from '../types/vehiculos';
import { Pagination } from '../components/ui/Pagination';

export default function VehiculosPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // TanStack Query hooks
  const { data, isLoading } = useVehiculos(debouncedSearch, page);
  const vehiculos = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const createVehiculo = useCreateVehiculo();
  const updateVehiculo = useUpdateVehiculo();
  const deleteVehiculo = useDeleteVehiculo();

  const handleCreate = () => {
    setSelectedVehiculo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (v: Vehiculo) => {
    setSelectedVehiculo(v);
    setIsModalOpen(true);
  };

  const handleDelete = async (v: Vehiculo) => {
    if (!window.confirm(`¿Está seguro de eliminar el vehículo con patente "${v.patente}"?`)) return;

    try {
      await deleteVehiculo.mutateAsync(v.id);
      toast.success('Vehículo eliminado');
    } catch {
      toast.error('Error al eliminar vehículo');
    }
  };

  const handleSave = async (data: VehiculoFormData) => {
    if (selectedVehiculo) {
      await updateVehiculo.mutateAsync({ id: selectedVehiculo.id, data });
    } else {
      await createVehiculo.mutateAsync(data);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-fluid-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Vehículos
          </h1>
          <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre la flota de transporte y asigne zonas de operación.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <Truck className="h-5 w-5" />
          NUEVO VEHÍCULO
        </button>
      </div>

      {/* Filters - Colapsables en móvil */}
      <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por patente, marca o modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </CollapsibleFilters>

      <VehiculoTable
        vehiculos={vehiculos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <VehiculoDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedVehiculo}
      />

      {/* FAB para móvil */}
      <FloatingActionButton
        onClick={handleCreate}
        icon={<Truck className="h-6 w-6" />}
        hideOnDesktop
        aria-label="Nuevo Vehículo"
      />
    </div>
  );
}
