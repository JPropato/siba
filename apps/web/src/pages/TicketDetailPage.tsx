import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronDown,
  Loader2,
  FileText,
  Wrench,
  Paperclip,
  History,
  Check,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Clock,
} from 'lucide-react';
import api from '../lib/api';
import { useTicketDetail } from '../hooks/api/useTicketDetail';
import type { Ticket, EstadoTicket } from '../types/tickets';
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  TIPO_TICKET_LABELS,
  TIPO_TICKET_COLORS,
  TIPO_TICKET_SLA,
  RUBRO_LABELS,
  TRANSICIONES_VALIDAS,
} from '../types/tickets';
import { Button } from '../components/ui/core/Button';
import TicketTabGeneral from '../components/tickets/TicketTabGeneral';
import TicketTabOT from '../components/tickets/TicketTabOT';
import TicketTabArchivos from '../components/tickets/TicketTabArchivos';
import TicketTabHistorial from '../components/tickets/TicketTabHistorial';

type TabId = 'general' | 'ot' | 'archivos' | 'historial';

// Labels y colores para cada transición
const TRANSICION_CONFIG: Record<EstadoTicket, { label: string; color: string }> = {
  NUEVO: { label: 'Volver a Nuevo', color: 'text-slate-600' },
  ASIGNADO: { label: 'Asignar', color: 'text-blue-600' },
  EN_CURSO: { label: 'Iniciar Trabajo', color: 'text-amber-600' },
  PENDIENTE_CLIENTE: { label: 'Pendiente Cliente', color: 'text-purple-600' },
  FINALIZADO: { label: 'Finalizar', color: 'text-green-600' },
  CANCELADO: { label: 'Cancelar', color: 'text-red-600' },
};

const getTransicionesDisponibles = (estadoActual: EstadoTicket) => {
  const estadosPermitidos = TRANSICIONES_VALIDAS[estadoActual] || [];
  return estadosPermitidos.map((estado) => ({
    estado,
    ...TRANSICION_CONFIG[estado],
  }));
};

function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCode(code: number) {
  return `TKT-${String(code).padStart(5, '0')}`;
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ticketId = id ? parseInt(id, 10) : null;

  const { data: ticket, isLoading, refetch } = useTicketDetail(ticketId);

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [isChangingEstado, setIsChangingEstado] = useState(false);

  const handleCambiarEstado = async (nuevoEstado: EstadoTicket) => {
    if (!ticket) return;
    try {
      setIsChangingEstado(true);
      setShowEstadoDropdown(false);
      await api.patch(`/tickets/${ticket.id}/estado`, { estado: nuevoEstado });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(`Estado actualizado a ${ESTADO_LABELS[nuevoEstado]}`);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al cambiar el estado';
      toast.error(errorMessage);
    } finally {
      setIsChangingEstado(false);
    }
  };

  const transicionesPermitidas = ticket ? getTransicionesDisponibles(ticket.estado) : [];

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'general', label: 'General', icon: FileText },
    { id: 'ot', label: 'Órdenes de Trabajo', icon: Wrench },
    { id: 'archivos', label: 'Archivos', icon: Paperclip },
    { id: 'historial', label: 'Historial', icon: History },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-500">No se encontró el ticket</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/tickets')}>
          Volver a Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="hover:text-brand transition-colors"
        >
          Tickets
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-slate-900 dark:text-white">
          {formatCode(ticket.codigoInterno)}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {ticket.descripcion}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Estado badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[ticket.estado]}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {ESTADO_LABELS[ticket.estado]}
            </span>

            {/* Tipo/SLA badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${TIPO_TICKET_COLORS[ticket.tipoTicket]}`}
            >
              {ticket.tipoTicket === 'SEA' && <AlertTriangle className="h-3 w-3" />}
              SLA: {TIPO_TICKET_LABELS[ticket.tipoTicket]}
            </span>

            {/* Relative timestamp */}
            <span className="text-sm text-slate-400">
              Reportado {formatRelativeTime(ticket.fechaCreacion)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Cambiar Estado dropdown */}
          {transicionesPermitidas.length > 0 && (
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                isLoading={isChangingEstado}
                rightIcon={
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`}
                  />
                }
              >
                Cambiar Estado
              </Button>

              {showEstadoDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEstadoDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                    <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      Cambiar estado a:
                    </div>
                    {transicionesPermitidas.map((transicion) => (
                      <button
                        key={transicion.estado}
                        onClick={() => {
                          if (confirm(`¿${transicion.label}?`)) {
                            handleCambiarEstado(transicion.estado);
                          } else {
                            setShowEstadoDropdown(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 ${transicion.color}`}
                      >
                        <Check className="h-4 w-4 opacity-0" />
                        {transicion.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex overflow-x-auto -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: 2 columns on desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' ? (
            <TicketTabGeneral
              ticket={ticket}
              onUpdate={() => refetch()}
              onSuccess={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['tickets'] });
              }}
            />
          ) : activeTab === 'ot' ? (
            <TicketTabOT
              ticket={ticket}
              onSuccess={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['tickets'] });
              }}
            />
          ) : activeTab === 'archivos' ? (
            <TicketTabArchivos ticketId={ticket.id} />
          ) : activeTab === 'historial' ? (
            <TicketTabHistorial ticketId={ticket.id} />
          ) : null}
        </div>

        {/* Side panel */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          {/* Client Details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Detalles del Cliente
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.sucursal?.cliente?.razonSocial || '-'}
                  </p>
                  <p className="text-xs text-slate-500">Cliente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.sucursal?.nombre || '-'}
                  </p>
                  <p className="text-xs text-slate-500">Sucursal</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {RUBRO_LABELS[ticket.rubro]}
                  </p>
                  <p className="text-xs text-slate-500">Rubro</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {TIPO_TICKET_LABELS[ticket.tipoTicket]}
                  </p>
                  <p className="text-xs text-slate-500">
                    SLA: {TIPO_TICKET_SLA[ticket.tipoTicket]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Asignación
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.tecnico
                      ? `${ticket.tecnico.nombre} ${ticket.tecnico.apellido}`
                      : 'Sin asignar'}
                  </p>
                  <p className="text-xs text-slate-500">Técnico</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(ticket.fechaCreacion)}
                  </p>
                  <p className="text-xs text-slate-500">Creado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(ticket.fechaProgramada)}
                  </p>
                  <p className="text-xs text-slate-500">Programado</p>
                </div>
              </div>

              {/* SLA progress bar */}
              <SLAProgress ticket={ticket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SLAProgress({ ticket }: { ticket: Ticket }) {
  const slaDays: Record<string, number> = {
    SEA: 1,
    SEP: 7,
    SN: 15,
  };
  const totalDays = slaDays[ticket.tipoTicket] || 15;
  const created = new Date(ticket.fechaCreacion);
  const now = new Date();
  const elapsed = (now.getTime() - created.getTime()) / 86400000;
  const percentage = Math.min((elapsed / totalDays) * 100, 100);
  const isOverdue = percentage >= 100;
  const isWarning = percentage >= 75;

  // Don't show for completed tickets
  if (ticket.estado === 'FINALIZADO' || ticket.estado === 'CANCELADO') return null;

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">Progreso SLA</span>
        <span
          className={`text-xs font-semibold ${isOverdue ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-500'}`}
        >
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {isOverdue
          ? `Vencido hace ${Math.round(elapsed - totalDays)} días`
          : `${Math.round(totalDays - elapsed)} días restantes`}
      </p>
    </div>
  );
}
