import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { ArrowLeftRight, Plus, Search, Download } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { FloatingActionButton } from '../../../components/layout/FloatingActionButton';
import { CollapsibleFilters } from '../../../components/layout/CollapsibleFilters';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '@/components/ui/core/Select';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import MovimientosTable from '../components/MovimientosTable';
import { useMovimientos } from '../hooks/useMovimientos';
import type { TipoMovimiento, EstadoMovimiento } from '../types';
import type { Movimiento } from '../types';
import { ESTADO_MOVIMIENTO_CONFIG } from '../types';

const MovimientoDrawer = lazy(() => import('../components/MovimientoDrawer'));

export default function MovimientosPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoMovimiento | ''>('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch } = useMovimientos({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    tipo: tipoFilter || undefined,
    estado: estadoFilter || undefined,
  });

  const movimientos = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? 0;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCreate = () => {
    setIsDrawerOpen(true);
  };

  const handleEdit = (_mov: Movimiento) => {
    setIsDrawerOpen(true);
  };

  const activeFiltersCount = [debouncedSearch, tipoFilter, estadoFilter].filter(Boolean).length;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<ArrowLeftRight className="h-5 w-5" />}
          breadcrumb={['Finanzas', 'Movimientos']}
          title="Movimientos"
          subtitle={`${total} registros encontrados`}
          count={total}
          action={
            <div className="hidden sm:flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            </div>
          }
        />

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={activeFiltersCount}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción, comprobante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
            </div>
            <Select
              value={tipoFilter}
              onChange={(val) => {
                setTipoFilter(val as TipoMovimiento | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos los tipos' },
                { value: 'INGRESO', label: 'Ingresos' },
                { value: 'EGRESO', label: 'Egresos' },
              ]}
              icon={<LayoutGrid className="h-4 w-4" />}
            />
            <Select
              value={estadoFilter}
              onChange={(val) => {
                setEstadoFilter(val as EstadoMovimiento | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos los estados' },
                ...Object.entries(ESTADO_MOVIMIENTO_CONFIG).map(([key, { label }]) => ({
                  value: key,
                  label,
                })),
              ]}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </div>
        </CollapsibleFilters>

        {/* Table */}
        <MovimientosTable movimientos={movimientos} onEdit={handleEdit} isLoading={isLoading} />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Drawer - Lazy loaded */}
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <MovimientoDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onSuccess={() => setIsDrawerOpen(false)}
            />
          </Suspense>
        )}

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nuevo Movimiento"
        />
      </div>
    </PullToRefresh>
  );
}
