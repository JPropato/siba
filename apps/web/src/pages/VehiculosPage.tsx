import { useState, useEffect, useCallback } from 'react';
import { Search, Truck, AlertTriangle, Wrench, CreditCard } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { toast } from 'sonner';
import VehiculoTable from '../components/vehiculos/VehiculoTable';
import VehiculoDialog from '../components/vehiculos/VehiculoDialog';
import VehiculoDetailSheet from '../components/vehiculos/VehiculoDetailSheet';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { StatCard } from '../components/dashboard/StatCard';
import {
  useVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
  useResumenVehiculos,
} from '../hooks/api/useVehiculos';
import type { Vehiculo, VehiculoFormData, EstadoVehiculo } from '../types/vehiculos';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../hooks/useConfirm';

type TabFilter = '' | EstadoVehiculo;

const TABS: { value: TabFilter; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'TALLER', label: 'En Taller' },
  { value: 'FUERA_SERVICIO', label: 'Fuera Servicio' },
];

export default function VehiculosPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState<TabFilter>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Vehiculo | null>(null);

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
  const { data, isLoading, refetch } = useVehiculos(debouncedSearch, page);
  const vehiculos = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const resumen = useResumenVehiculos();
  const createVehiculo = useCreateVehiculo();
  const updateVehiculo = useUpdateVehiculo();
  const deleteVehiculo = useDeleteVehiculo();
  const { confirm, ConfirmDialog } = useConfirm();

  // Client-side filtering por estado
  const filteredVehiculos = estadoFilter
    ? vehiculos.filter((v) => v.estado === estadoFilter)
    : vehiculos;

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

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSave = async (data: VehiculoFormData) => {
    if (selectedVehiculo) {
      await updateVehiculo.mutateAsync({ id: selectedVehiculo.id, data });
    } else {
      await createVehiculo.mutateAsync(data);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Truck className="h-5 w-5" />}
          breadcrumb={['Administración', 'Vehículos']}
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

        {/* Stat Cards */}
        {resumen.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Activos"
              value={resumen.data.totalActivos}
              icon={Truck}
              color="emerald"
            />
            <StatCard title="En Taller" value={resumen.data.enTaller} icon={Wrench} color="gold" />
            <StatCard
              title="Fuera Serv."
              value={resumen.data.fueraServicio}
              icon={Truck}
              color="orange"
            />
            <StatCard
              title="VTV Alerta"
              value={resumen.data.vtvPorVencer}
              icon={AlertTriangle}
              color="gold"
            />
            <StatCard
              title="Aceite"
              value={resumen.data.aceitePorCambiar}
              icon={AlertTriangle}
              color="orange"
            />
            <StatCard
              title="Multas Pend."
              value={resumen.data.multasPendientes}
              icon={CreditCard}
              color="indigo"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setEstadoFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                estadoFilter === tab.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          vehiculos={filteredVehiculos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={setSelectedDetail}
          isLoading={isLoading}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <VehiculoDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedVehiculo}
        />

        <VehiculoDetailSheet
          vehiculo={selectedDetail}
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />

        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
