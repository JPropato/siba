import { useState, useCallback, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Ticket, EstadoTicket, RubroTicket, TipoTicket } from '../types/tickets';
import { useTickets, useDeleteTicket } from '../hooks/api/useTickets';
import { useLiveAnnounce } from '../hooks/useLiveAnnounce';
import { LiveRegion } from '../components/ui/LiveRegion';
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  TIPO_TICKET_LABELS,
  TIPO_TICKET_COLORS,
  RUBRO_LABELS,
} from '../types/tickets';

// Lazy loading de componentes pesados (solo se cargan cuando se necesitan)
const TicketDrawer = lazy(() => import('../components/tickets/TicketDrawer'));
const TicketDetailSheet = lazy(() => import('../components/tickets/TicketDetailSheet'));
const KanbanBoard = lazy(() => import('../components/tickets/KanbanBoard'));
import { Select } from '../components/ui/core/Select';
import {
  Search,
  LayoutGrid,
  AlertCircle,
  Clock,
  Plus,
  ChevronDown,
  Filter,
  List,
  Columns,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { Pagination } from '../components/ui/Pagination';
import { ViewToggle } from '../components/ui/ViewToggle';
import { PullToRefresh } from '../components/ui/PullToRefresh';

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoTicket | ''>('');
  const [rubroFilter, setRubroFilter] = useState<RubroTicket | ''>('');
  const [tipoTicketFilter, setTipoTicketFilter] = useState<TipoTicket | ''>('');
  const [page, setPage] = useState(1);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTicketIdSheet, setDetailTicketIdSheet] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const navigate = useNavigate();

  // Accesibilidad: anuncios para screen readers
  const { announce, message } = useLiveAnnounce();

  // TanStack Query: tickets con paginación server-side y filtros
  const {
    data: ticketsData,
    isLoading,
    refetch,
  } = useTickets({
    search,
    estado: estadoFilter,
    rubro: rubroFilter,
    tipoTicket: tipoTicketFilter,
    page,
    limit: 10,
  });

  const tickets = ticketsData?.data ?? [];
  const totalPages = ticketsData?.meta?.totalPages ?? 1;
  const total = ticketsData?.meta?.total ?? 0;

  const deleteTicketMutation = useDeleteTicket();

  // Prefetching: cargar detalles de ticket en hover
  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowMouseEnter = useCallback(
    (ticketId: number) => {
      // Delay de 150ms para evitar prefetch en hover accidental
      prefetchTimeoutRef.current = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ['ticket', ticketId],
          queryFn: () => api.get(`/tickets/${ticketId}`).then((r) => r.data),
          staleTime: 30 * 1000,
        });
      }, 150);
    },
    [queryClient]
  );

  const handleRowMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedTicket(null);
    setIsDrawerOpen(true);
  }, []);

  const handleViewDetail = useCallback((ticket: Ticket) => {
    setDetailTicketIdSheet(ticket.id);
    setIsDetailOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (ticket: Ticket) => {
      if (!confirm(`¿Eliminar el ticket TKT-${String(ticket.codigoInterno).padStart(5, '0')}?`))
        return;
      try {
        await deleteTicketMutation.mutateAsync(ticket.id);
        announce(`Ticket ${ticket.codigoInterno} eliminado`);
      } catch (error) {
        console.error('Error deleting ticket:', error);
        announce('Error al eliminar el ticket');
      }
    },
    [deleteTicketMutation, announce]
  );

  const handleTicketSuccess = (ticketId: number) => {
    setIsDrawerOpen(false);
    refetch();
    // Abrir sheet de detalle del ticket creado
    setDetailTicketIdSheet(ticketId);
    setIsDetailOpen(true);
  };

  const formatCode = (code: number) => `TKT-${String(code).padStart(5, '0')}`;
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handler para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
    announce('Lista actualizada');
  }, [refetch, announce]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Accesibilidad: región para anuncios dinámicos */}
        <LiveRegion message={message} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-fluid-2xl font-bold text-slate-900 dark:text-white">
              Tickets de Servicio
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-fluid-sm mt-1">
              {total} tickets en total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle Vista con animación */}
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'table', icon: List, label: 'Vista Tabla' },
                { value: 'kanban', icon: Columns, label: 'Vista Kanban' },
              ]}
            />

            <button
              onClick={handleCreate}
              className="hidden md:flex px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              NUEVO TICKET
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Toggle Button - Solo móvil */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="w-full md:hidden flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {(estadoFilter || rubroFilter || tipoTicketFilter) && (
                <span className="ml-1 px-2 py-0.5 bg-brand text-white text-xs rounded-full">
                  {[estadoFilter, rubroFilter, tipoTicketFilter].filter(Boolean).length}
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                isFiltersOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Filters Grid - Expandible en móvil, siempre visible en desktop */}
          <div
            className={`
            md:block p-4
            ${isFiltersOpen ? 'block' : 'hidden'}
          `}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por descripción, código..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                />
              </div>
              <Select
                label="Estado"
                value={estadoFilter}
                onChange={(val) => {
                  setEstadoFilter(val as EstadoTicket | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos los estados' },
                  ...Object.entries(ESTADO_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v as string,
                  })),
                ]}
                icon={<AlertCircle className="h-4 w-4" />}
              />
              <Select
                label="Rubro"
                value={rubroFilter}
                onChange={(val) => {
                  setRubroFilter(val as RubroTicket | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos los rubros' },
                  ...Object.entries(RUBRO_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v as string,
                  })),
                ]}
                icon={<LayoutGrid className="h-4 w-4" />}
              />
              <Select
                label="Tipo (SLA)"
                value={tipoTicketFilter}
                onChange={(val) => {
                  setTipoTicketFilter(val as TipoTicket | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos los tipos' },
                  ...Object.entries(TIPO_TICKET_LABELS).map(([k, v]) => ({
                    value: k,
                    label: v as string,
                  })),
                ]}
                icon={<Clock className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        {/* Vista Tabla o Kanban */}
        {viewMode === 'table' ? (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Código
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Descripción
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Sucursal
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Técnico
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Estado
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      Tipo
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
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No se encontraron tickets
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(t)}
                        onDoubleClick={() => navigate(`/dashboard/tickets/${t.id}`)}
                        onMouseEnter={() => handleRowMouseEnter(t.id)}
                        onMouseLeave={handleRowMouseLeave}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-brand">
                            {formatCode(t.codigoInterno)}
                          </div>
                          {t.codigoCliente && (
                            <div className="text-xs text-slate-400">{t.codigoCliente}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate">
                            {t.descripcion}
                          </div>
                          <div className="text-xs text-slate-400">{RUBRO_LABELS[t.rubro]}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-900 dark:text-white">
                            {t.sucursal?.nombre || '-'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {t.sucursal?.cliente?.razonSocial || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {t.tecnico ? `${t.tecnico.nombre} ${t.tecnico.apellido}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[t.estado]}`}
                          >
                            {ESTADO_LABELS[t.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${TIPO_TICKET_COLORS[t.tipoTicket]}`}
                          >
                            {TIPO_TICKET_LABELS[t.tipoTicket]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                          {formatDate(t.fechaCreacion)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleViewDetail(t)}
                              className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                              title="Ver detalle"
                              aria-label="Ver detalle"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            }
          >
            <KanbanBoard
              tickets={tickets}
              isLoading={isLoading}
              onEditTicket={handleViewDetail}
              onDeleteTicket={handleDelete}
            />
          </Suspense>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Drawer de Creación/Edición - Lazy loaded */}
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <TicketDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              ticket={selectedTicket}
              onSuccess={handleTicketSuccess}
            />
          </Suspense>
        )}

        {/* Detail Sheet - Lazy loaded */}
        {isDetailOpen && (
          <Suspense fallback={null}>
            <TicketDetailSheet
              isOpen={isDetailOpen}
              onClose={() => {
                setIsDetailOpen(false);
                setDetailTicketIdSheet(null);
              }}
              ticketId={detailTicketIdSheet}
              onSuccess={() => refetch()}
            />
          </Suspense>
        )}

        {/* FAB para móviles - Ergonomía táctil optimizada */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          label="NUEVO"
          hideOnDesktop
          variant="primary"
          size="lg"
        />
      </div>
    </PullToRefresh>
  );
}
