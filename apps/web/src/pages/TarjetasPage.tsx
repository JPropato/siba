import { useState, useEffect, useCallback } from 'react';
import { Search, CreditCard, DollarSign } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { toast } from 'sonner';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { StatCard } from '../components/dashboard/StatCard';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../hooks/useConfirm';
import {
  useTarjetas,
  useResumenTarjetas,
  useCreateTarjeta,
  useUpdateTarjeta,
  useDeleteTarjeta,
  type TarjetaPrecargable,
  type TarjetaFormData,
  type TipoTarjeta,
} from '../features/tarjetas';
import TarjetaTable from '../features/tarjetas/components/TarjetaTable';
import TarjetaDialog from '../features/tarjetas/components/TarjetaDialog';
import TarjetaDetailSheet from '../features/tarjetas/components/TarjetaDetailSheet';
import ConfigCategoriasSection from '../features/tarjetas/components/ConfigCategoriasSection';

type TabFilter = '' | TipoTarjeta | 'config';

const TABS: { value: TabFilter; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PRECARGABLE', label: 'Precargables' },
  { value: 'CORPORATIVA', label: 'Corporativas' },
  { value: 'config', label: 'Configuración' },
];

export default function TarjetasPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState<TabFilter>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaPrecargable | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<TarjetaPrecargable | null>(null);

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
  const { data, isLoading, refetch } = useTarjetas({
    search: debouncedSearch,
    page,
    limit: 10,
  });
  const tarjetas = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const resumen = useResumenTarjetas();
  const createTarjeta = useCreateTarjeta();
  const updateTarjeta = useUpdateTarjeta();
  const deleteTarjeta = useDeleteTarjeta();
  const { confirm, ConfirmDialog } = useConfirm();

  // Client-side filtering por tipo (except config tab)
  const filteredTarjetas =
    tipoFilter && tipoFilter !== 'config'
      ? tarjetas.filter((t) => t.tipo === tipoFilter)
      : tarjetas;

  const handleCreate = () => {
    setSelectedTarjeta(null);
    setIsModalOpen(true);
  };

  const handleEdit = (t: TarjetaPrecargable) => {
    setSelectedTarjeta(t);
    setIsModalOpen(true);
  };

  const handleDelete = async (t: TarjetaPrecargable) => {
    const ok = await confirm({
      title: 'Eliminar tarjeta',
      message: `¿Está seguro de eliminar la tarjeta "${t.alias || 'sin alias'}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteTarjeta.mutateAsync(t.id);
      toast.success('Tarjeta eliminada');
    } catch {
      toast.error('Error al eliminar tarjeta');
    }
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSave = async (data: TarjetaFormData) => {
    if (selectedTarjeta) {
      await updateTarjeta.mutateAsync({ id: selectedTarjeta.id, data });
    } else {
      await createTarjeta.mutateAsync(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<CreditCard className="h-5 w-5" />}
          breadcrumb={['Tesorería', 'Tarjetas']}
          title="Gestión de Tarjetas"
          subtitle="Administración de tarjetas precargables y corporativas"
          count={tarjetas.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <CreditCard className="h-4 w-4" />
              Nueva
            </button>
          }
        />

        {/* Stat Cards */}
        {resumen.data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard title="Total" value={resumen.data.total} icon={CreditCard} color="brand" />
            <StatCard
              title="Precargables"
              value={resumen.data.precargables}
              icon={CreditCard}
              color="indigo"
            />
            <StatCard
              title="Corporativas"
              value={resumen.data.corporativas}
              icon={CreditCard}
              color="gold"
            />
            <StatCard
              title="Saldo Prec."
              value={formatCurrency(resumen.data.saldoPrecargables)}
              icon={DollarSign}
              color="emerald"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setTipoFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                tipoFilter === tab.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conditional rendering: Config tab or Table */}
        {tipoFilter === 'config' ? (
          <ConfigCategoriasSection />
        ) : (
          <>
            {/* Filters - Colapsables en móvil */}
            <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por alias, número o titular..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </CollapsibleFilters>

            <TarjetaTable
              tarjetas={filteredTarjetas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={setSelectedDetail}
              isLoading={isLoading}
            />

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        <TarjetaDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedTarjeta}
        />

        <TarjetaDetailSheet
          tarjeta={selectedDetail}
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />

        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
