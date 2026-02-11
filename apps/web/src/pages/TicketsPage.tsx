import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { Ticket, EstadoTicket, RubroTicket, TipoTicket } from '../types/tickets';
import { useTickets, useDeleteTicket } from '../hooks/api/useTickets';
import { useLiveAnnounce } from '../hooks/useLiveAnnounce';
import { LiveRegion } from '../components/ui/LiveRegion';
import { useConfirm } from '../hooks/useConfirm';
import { ESTADO_LABELS, TIPO_TICKET_LABELS, RUBRO_LABELS } from '../types/tickets';
import api from '../lib/api';

const TicketDrawer = lazy(() => import('../components/tickets/TicketDrawer'));
const TicketDetailSheet = lazy(() => import('../components/tickets/TicketDetailSheet'));
const KanbanBoard = lazy(() => import('../components/tickets/KanbanBoard'));

import { PageHeader } from '../components/ui/PageHeader';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { Select } from '../components/ui/core/Select';
import TicketTable from '../components/tickets/TicketTable';
import {
  Search,
  LayoutGrid,
  AlertCircle,
  Clock,
  Plus,
  List,
  Columns,
  Loader2,
  Ticket as TicketIcon,
  Building2,
  User,
} from 'lucide-react';
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { Pagination } from '../components/ui/Pagination';
import { ViewToggle } from '../components/ui/ViewToggle';
import { PullToRefresh } from '../components/ui/PullToRefresh';

interface RefCliente {
  id: number;
  razonSocial: string;
}
interface RefTecnico {
  id: number;
  nombre: string;
  apellido: string;
}

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoTicket | ''>('');
  const [rubroFilter, setRubroFilter] = useState<RubroTicket | ''>('');
  const [tipoTicketFilter, setTipoTicketFilter] = useState<TipoTicket | ''>('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('fechaCreacion');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTicketIdSheet, setDetailTicketIdSheet] = useState<number | null>(null);

  // Reference data for filter dropdowns
  const [clientes, setClientes] = useState<RefCliente[]>([]);
  const [tecnicos, setTecnicos] = useState<RefTecnico[]>([]);

  useEffect(() => {
    api
      .get('/tickets/reference-data')
      .then((res) => {
        setClientes(res.data.clientes || []);
        setTecnicos(res.data.tecnicos || []);
      })
      .catch(console.error);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Accesibilidad
  const { announce, message } = useLiveAnnounce();

  // TanStack Query
  const {
    data: ticketsData,
    isLoading,
    refetch,
  } = useTickets({
    search: debouncedSearch,
    estado: estadoFilter,
    rubro: rubroFilter,
    tipoTicket: tipoTicketFilter,
    tecnicoId: tecnicoFilter,
    clienteId: clienteFilter,
    page,
    limit: 10,
    sortBy,
    sortDir,
  });

  const tickets = ticketsData?.data ?? [];
  const totalPages = ticketsData?.meta?.totalPages ?? 1;
  const total = ticketsData?.meta?.total ?? 0;

  const deleteTicketMutation = useDeleteTicket();
  const { confirm, ConfirmDialog } = useConfirm();

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
      const ok = await confirm({
        title: 'Eliminar ticket',
        message: `¿Eliminar el ticket TKT-${String(ticket.codigoInterno).padStart(5, '0')}?`,
        confirmLabel: 'Eliminar',
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await deleteTicketMutation.mutateAsync(ticket.id);
        announce(`Ticket ${ticket.codigoInterno} eliminado`);
      } catch (error) {
        console.error('Error deleting ticket:', error);
        announce('Error al eliminar el ticket');
      }
    },
    [deleteTicketMutation, announce, confirm]
  );

  const handleTicketSuccess = (ticketId: number) => {
    setIsDrawerOpen(false);
    refetch();
    setDetailTicketIdSheet(ticketId);
    setIsDetailOpen(true);
  };

  const handleSort = useCallback(
    (field: string) => {
      if (field === sortBy) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortDir('asc');
      }
    },
    [sortBy]
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    announce('Lista actualizada');
  }, [refetch, announce]);

  const activeFiltersCount =
    [estadoFilter, rubroFilter, tipoTicketFilter, tecnicoFilter, clienteFilter].filter(Boolean)
      .length + (search ? 1 : 0);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <LiveRegion message={message} />

        <PageHeader
          icon={<TicketIcon className="h-5 w-5" />}
          breadcrumb={['Comercial', 'Tickets']}
          title="Tickets de Servicio"
          subtitle="Solicitudes de servicio y mantenimiento"
          count={total}
          action={
            <div className="flex items-center gap-3">
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            </div>
          }
        />

        <CollapsibleFilters activeFiltersCount={activeFiltersCount}>
          <div className="space-y-3">
            {/* Row 1: Search + Estado + Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por descripción, código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
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
            {/* Row 2: Cliente + Técnico + Rubro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
              <Select
                label="Cliente"
                value={clienteFilter}
                onChange={(val) => {
                  setClienteFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos los clientes' },
                  ...clientes.map((c) => ({
                    value: c.id.toString(),
                    label: c.razonSocial,
                  })),
                ]}
                icon={<Building2 className="h-4 w-4" />}
              />
              <Select
                label="Técnico"
                value={tecnicoFilter}
                onChange={(val) => {
                  setTecnicoFilter(val);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Todos los técnicos' },
                  ...tecnicos.map((t) => ({
                    value: t.id.toString(),
                    label: `${t.nombre} ${t.apellido}`,
                  })),
                ]}
                icon={<User className="h-4 w-4" />}
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
            </div>
          </div>
        </CollapsibleFilters>

        {viewMode === 'table' ? (
          <TicketTable
            tickets={tickets}
            onViewDetail={handleViewDetail}
            onDelete={handleDelete}
            isLoading={isLoading}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
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

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

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

        {ConfirmDialog}

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
