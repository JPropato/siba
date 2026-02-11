import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, User, Calendar, Activity } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { CollapsibleFilters } from '../../../components/layout/CollapsibleFilters';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '@/components/ui/core/Select';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuditEventos } from '../hooks/useAudit';
import AuditTable from '../components/AuditTable';

const MODULO_OPTIONS = [
  { value: '', label: 'Todos los módulos' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'obras', label: 'Obras' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'sedes', label: 'Sedes' },
  { value: 'empleados', label: 'Empleados' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'materiales', label: 'Materiales' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'roles', label: 'Roles' },
  { value: 'ordenes_trabajo', label: 'Órdenes de Trabajo' },
  { value: 'zonas', label: 'Zonas' },
];

const ACCION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREAR', label: 'Crear' },
  { value: 'ACTUALIZAR', label: 'Actualizar' },
  { value: 'ELIMINAR', label: 'Eliminar' },
  { value: 'CAMBIO_ESTADO', label: 'Cambio de Estado' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'ANULAR', label: 'Anular' },
  { value: 'CONFIRMAR', label: 'Confirmar' },
  { value: 'LOGIN', label: 'Inicio de Sesión' },
  { value: 'LOGOUT', label: 'Cierre de Sesión' },
];

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduloFilter, setModuloFilter] = useState('');
  const [accionFilter, setAccionFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch } = useAuditEventos({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    modulo: moduloFilter || undefined,
    accion: accionFilter || undefined,
  });

  const eventos = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? 0;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const activeFiltersCount = [debouncedSearch, moduloFilter, accionFilter].filter(Boolean).length;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Shield className="h-5 w-5" />}
          breadcrumb={['Administración', 'Auditoría']}
          title="Registro de Actividad"
          subtitle={`${total} eventos registrados`}
          count={total}
        />

        <CollapsibleFilters activeFiltersCount={activeFiltersCount}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
            </div>
            <Select
              value={moduloFilter}
              onChange={(val) => {
                setModuloFilter(val);
                setPage(1);
              }}
              options={MODULO_OPTIONS}
              icon={<Activity className="h-4 w-4" />}
            />
            <Select
              value={accionFilter}
              onChange={(val) => {
                setAccionFilter(val);
                setPage(1);
              }}
              options={ACCION_OPTIONS}
              icon={<User className="h-4 w-4" />}
            />
          </div>
        </CollapsibleFilters>

        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Calendar className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : eventos.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-6 w-6 text-brand" />}
            title="Sin eventos"
            description="No se encontraron eventos con los filtros aplicados."
          />
        ) : (
          <AuditTable eventos={eventos} />
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </PullToRefresh>
  );
}
