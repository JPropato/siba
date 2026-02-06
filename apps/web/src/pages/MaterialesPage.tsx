import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import MaterialTable from '../components/materiales/MaterialTable';
import MaterialDialog from '../components/materiales/MaterialDialog';
import type { Material, MaterialFormData } from '../types/materiales';
import { Select } from '../components/ui/core/Select';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { Search, LayoutGrid, PlusSquare } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import {
  useMateriales,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '../hooks/api/useMateriales';

export default function MaterialesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data, isLoading, refetch } = useMateriales({
    search: debouncedSearch,
    categoria: categoriaFilter,
    page,
    limit: 10,
  });
  const materiales = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const handleCreate = () => {
    setSelectedMaterial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (m: Material) => {
    setSelectedMaterial(m);
    setIsModalOpen(true);
  };

  const handleDelete = async (m: Material) => {
    if (!window.confirm(`¿Está seguro de eliminar el material "${m.nombre}"?`)) return;

    try {
      await deleteMaterial.mutateAsync(m.id);
      toast.success('Material eliminado');
    } catch {
      toast.error('Error al eliminar material');
    }
  };

  const handleSave = async (data: MaterialFormData) => {
    if (selectedMaterial) {
      await updateMaterial.mutateAsync({ id: selectedMaterial.id, data });
    } else {
      await createMaterial.mutateAsync(data);
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
              Maestro de Materiales
            </h1>
            <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
              Gestión centralizada del catálogo de insumos, productos y equipamiento.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <PlusSquare className="h-5 w-5" />
            NUEVO MATERIAL
          </button>
        </div>

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={[search, categoriaFilter].filter(Boolean).length}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
              />
            </div>
            <Select
              className="w-full sm:w-48 h-10"
              value={categoriaFilter}
              onChange={(val) => {
                setCategoriaFilter(val as string);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todas las categorías' },
                { value: 'Limpieza', label: 'Limpieza' },
                { value: 'Construcción', label: 'Construcción' },
                { value: 'Oficina', label: 'Oficina' },
                { value: 'Seguridad', label: 'Seguridad' },
                { value: 'Electrónica', label: 'Electrónica' },
                { value: 'Otros', label: 'Otros' },
              ]}
              icon={<LayoutGrid className="h-4 w-4" />}
            />
          </div>
        </CollapsibleFilters>

        <MaterialTable
          materiales={materiales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <MaterialDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={selectedMaterial}
        />

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<PlusSquare className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nuevo Material"
        />
      </div>
    </PullToRefresh>
  );
}
