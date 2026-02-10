import { useState, useEffect } from 'react';
import { Search, Truck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
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
import { useConfirm } from '../hooks/useConfirm';

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
  const { confirm, ConfirmDialog } = useConfirm();

  const handleCreate = () => {
    setSelectedVehiculo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (v: Vehiculo) => {
    setSelectedVehiculo(v);
    setIsModalOpen(true);
  };

  const handleDelete = async (v: Vehiculo) => {
    const ok = await confirm({
      title: 'Eliminar vehículo',
      message: `¿Está seguro de eliminar el vehículo con patente "${v.patente}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

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
    <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
      <PageHeader
        icon={<Truck className="h-5 w-5" />}
        breadcrumb={['Logística', 'Vehículos']}
        title="Vehículos"
        subtitle="Flota de transporte y zonas"
        count={vehiculos.length}
        action={
          <button
            onClick={handleCreate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Truck className="h-4 w-4" />
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

      {ConfirmDialog}

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
