import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import SedeTable from '../components/sedes/SedeTable';
import SedeDialog from '../components/sedes/SedeDialog';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import type { Sede, SedeFormData } from '../types/sedes';

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

  const fetchSedes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sedes', {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      if (res.data && res.data.data) {
        setSedes(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      } else {
        setSedes([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching sedes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchSedes();
      else setPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSedes();
  }, [page]);

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
      await api.delete(`/sedes/${sede.id}`);
      fetchSedes();
    } catch (error) {
      console.error('Error deleting sede:', error);
      alert('Error al eliminar sede');
    }
  };

  const handleSave = async (data: SedeFormData) => {
    if (selectedSede) {
      await api.put(`/sedes/${selectedSede.id}`, data);
    } else {
      await api.post('/sedes', data);
    }
    fetchSedes();
  };

  return (
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

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
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
  );
}
