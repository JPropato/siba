import { Loader2, Eye, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { obrasApi } from '../api/obrasApi';
import type { Obra, EstadoObra, TipoObra, ObraFilters } from '../types';
import { ESTADO_OBRA_CONFIG, TIPO_OBRA_CONFIG } from '../types';
import ObraDrawer from './ObraDrawer';
import { Building2, Plus, Search, Filter, Wrench, LayoutGrid, Activity } from 'lucide-react';
import { Select } from '@/components/ui/core/Select';

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoObra | ''>('');
  const [tipoFilter, setTipoFilter] = useState<TipoObra | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [initialTicketId, setInitialTicketId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle createFrom=ticket param from OTDialog
  useEffect(() => {
    const createFrom = searchParams.get('createFrom');
    const ticketId = searchParams.get('ticketId');

    if (createFrom === 'ticket' && ticketId) {
      setInitialTicketId(Number(ticketId));
      setSelectedObra(null);
      setIsDrawerOpen(true);
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchObras = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: ObraFilters = {
        page,
        limit: 10,
      };
      if (search) filters.search = search;
      if (estadoFilter) filters.estado = estadoFilter;
      if (tipoFilter) filters.tipo = tipoFilter;

      const res = await obrasApi.getAll(filters);
      setObras(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotal(res.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching obras:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, estadoFilter, tipoFilter]);

  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  const handleCreate = () => {
    setSelectedObra(null);
    setInitialTicketId(null);
    setIsDrawerOpen(true);
  };

  const handleView = (obra: Obra) => {
    setSelectedObra(obra);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (obra: Obra) => {
    if (obra.estado !== 'BORRADOR') {
      alert('Solo se pueden eliminar obras en estado BORRADOR');
      return;
    }
    if (!confirm(`¿Eliminar la obra ${obra.codigo}?`)) return;
    try {
      await obrasApi.delete(obra.id);
      fetchObras();
    } catch (error) {
      console.error('Error deleting obra:', error);
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-7 w-7 text-gold" />
            Obras y Presupuestos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{total} obras en total</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          NUEVA OBRA
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3 text-slate-500">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
            />
          </div>
          <Select
            className="h-10"
            value={estadoFilter}
            onChange={(val) => {
              setEstadoFilter(val as EstadoObra | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los estados' },
              ...Object.entries(ESTADO_OBRA_CONFIG).map(([key, { label }]) => ({
                value: key,
                label,
              })),
            ]}
            icon={<Activity className="h-4 w-4" />}
          />
          <Select
            className="h-10"
            value={tipoFilter}
            onChange={(val) => {
              setTipoFilter(val as TipoObra | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...Object.entries(TIPO_OBRA_CONFIG).map(([key, { label }]) => ({
                value: key,
                label,
              })),
            ]}
            icon={<LayoutGrid className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Código
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Título
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Cliente
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Tipo</th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Estado
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Monto
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                  Fecha
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </td>
                </tr>
              ) : obras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron obras
                  </td>
                </tr>
              ) : (
                obras.map((obra) => {
                  const estadoConfig = ESTADO_OBRA_CONFIG[obra.estado];
                  const tipoConfig = TIPO_OBRA_CONFIG[obra.tipo];
                  return (
                    <tr
                      key={obra.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                      onClick={() => handleView(obra)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-brand">{obra.codigo}</div>
                        {obra.ticket && (
                          <div className="text-xs text-slate-400">
                            TKT-{String(obra.ticket.codigoInterno).padStart(5, '0')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          {obra.titulo}
                        </div>
                        {obra.sucursal && (
                          <div className="text-xs text-slate-400">{obra.sucursal.nombre}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {obra.cliente?.razonSocial || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          {obra.tipo === 'OBRA_MAYOR' ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <Wrench className="h-4 w-4" />
                          )}
                          <span className="text-sm">{tipoConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoConfig.color} ${estadoConfig.bgColor}`}
                        >
                          {estadoConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                        {formatMonto(Number(obra.montoPresupuestado))}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                        {formatDate(obra.fechaSolicitud)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleView(obra)}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Ver detalle"
                            aria-label="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {obra.estado === 'BORRADOR' && (
                            <button
                              onClick={() => handleDelete(obra)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                              aria-label="Eliminar"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Drawer */}
      <ObraDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedObra(null);
          setInitialTicketId(null);
        }}
        obra={selectedObra}
        ticketId={initialTicketId}
        onSuccess={() => {
          fetchObras();
          setIsDrawerOpen(false);
          setSelectedObra(null);
          setInitialTicketId(null);
        }}
      />
    </div>
  );
}
