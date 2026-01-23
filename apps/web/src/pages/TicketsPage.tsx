import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type {
  Ticket,
  EstadoTicket,
  RubroTicket,
  PrioridadTicket,
} from '../types/tickets';
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
  RUBRO_LABELS,
} from '../types/tickets';
import TicketDrawer from '../components/tickets/TicketDrawer';
import KanbanBoard from '../components/tickets/KanbanBoard';
import { OTDialog } from '../features/ordenes-trabajo';
import { Select } from '../components/ui/core/Select';
import { Search, LayoutGrid, AlertCircle, TrendingUp } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoTicket | ''>('');
  const [rubroFilter, setRubroFilter] = useState<RubroTicket | ''>('');
  const [prioridadFilter, setPrioridadFilter] = useState<PrioridadTicket | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [otTicket, setOtTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (estadoFilter) params.append('estado', estadoFilter);
      if (rubroFilter) params.append('rubro', rubroFilter);
      if (prioridadFilter) params.append('prioridad', prioridadFilter);

      const res = await api.get(`/tickets?${params}`);
      setTickets(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotal(res.data.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, estadoFilter, rubroFilter, prioridadFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreate = () => {
    setSelectedTicket(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (ticket: Ticket) => {
    if (!confirm(`¿Eliminar el ticket TKT-${String(ticket.codigoInterno).padStart(5, '0')}?`))
      return;
    try {
      await api.delete(`/tickets/${ticket.id}`);
      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tickets de Servicio</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {total} tickets en total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Vista */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-gold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              title="Vista Tabla"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${viewMode === 'kanban'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-gold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              title="Vista Kanban"
            >
              <span className="material-symbols-outlined text-[20px]">view_kanban</span>
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            NUEVO TICKET
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
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
            className="h-10"
            value={estadoFilter}
            onChange={(val) => {
              setEstadoFilter(val as EstadoTicket | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los estados' },
              ...Object.entries(ESTADO_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <Select
            className="h-10"
            value={rubroFilter}
            onChange={(val) => {
              setRubroFilter(val as RubroTicket | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los rubros' },
              ...Object.entries(RUBRO_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
            icon={<LayoutGrid className="h-4 w-4" />}
          />
          <Select
            className="h-10"
            value={prioridadFilter}
            onChange={(val) => {
              setPrioridadFilter(val as PrioridadTicket | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todas las prioridades' },
              ...Object.entries(PRIORIDAD_LABELS).map(([k, v]) => ({ value: k, label: v })),
            ]}
            icon={<TrendingUp className="h-4 w-4" />}
          />
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
                    Prioridad
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
                      <span className="material-symbols-outlined animate-spin text-3xl">
                        progress_activity
                      </span>
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
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
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${PRIORIDAD_COLORS[t.prioridad]}`}
                        >
                          {PRIORIDAD_LABELS[t.prioridad]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                        {formatDate(t.fechaCreacion)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          {t.estado !== 'FINALIZADO' && (
                            <button
                              onClick={() => setOtTicket(t)}
                              className="p-2 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                              title="Orden de Trabajo"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                assignment
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
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
        <KanbanBoard
          tickets={tickets}
          isLoading={isLoading}
          onEditTicket={handleEdit}
          onDeleteTicket={handleDelete}
        />
      )}

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
      <TicketDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ticket={selectedTicket}
        onSuccess={fetchTickets}
      />

      {/* OT Dialog */}
      {otTicket && (
        <OTDialog
          isOpen={!!otTicket}
          onClose={() => setOtTicket(null)}
          ticket={otTicket}
          onSuccess={fetchTickets}
        />
      )}
    </div>
  );
}
