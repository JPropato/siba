import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, UserPlus } from 'lucide-react';
import EmpleadoTable from '../components/empleados/EmpleadoTable';
import EmpleadoDialog from '../components/empleados/EmpleadoDialog';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import type { Empleado, EmpleadoFormData } from '../types/empleados';
import { Pagination } from '../components/ui/Pagination';

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);

  const fetchEmpleados = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/empleados', {
        params: {
          search: search || undefined,
          page,
          limit: 10,
        },
      });
      setEmpleados(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching empleados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmpleados();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleCreate = () => {
    setSelectedEmpleado(null);
    setIsModalOpen(true);
  };

  const handleEdit = (e: Empleado) => {
    setSelectedEmpleado(e);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: Empleado) => {
    if (!window.confirm(`¿Está seguro de eliminar al empleado "${e.apellido}, ${e.nombre}"?`))
      return;

    try {
      await api.delete(`/empleados/${e.id}`);
      fetchEmpleados();
    } catch (error) {
      console.error('Error deleting empleado:', error);
    }
  };

  const handleSave = async (data: EmpleadoFormData) => {
    if (selectedEmpleado) {
      await api.put(`/empleados/${selectedEmpleado.id}`, data);
    } else {
      await api.post('/empleados', data);
    }
    fetchEmpleados();
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-fluid-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Empleados
          </h1>
          <p className="text-fluid-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre el personal de la empresa y sus asignaciones.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          NUEVO EMPLEADO
        </button>
      </div>

      {/* Filters - Colapsables en móvil */}
      <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </CollapsibleFilters>

      <EmpleadoTable
        empleados={empleados}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <EmpleadoDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedEmpleado}
      />

      {/* FAB para móvil */}
      <FloatingActionButton
        onClick={handleCreate}
        icon={<UserPlus className="h-6 w-6" />}
        hideOnDesktop
        aria-label="Nuevo Empleado"
      />
    </div>
  );
}
