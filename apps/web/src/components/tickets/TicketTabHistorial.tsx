import { useState, useEffect } from 'react';
import {
  Loader2,
  Clock,
  ArrowRightLeft,
  UserPlus,
  PenLine,
  Plus,
  FileText,
  Send,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Trash2,
  Settings,
} from 'lucide-react';
import api from '../../lib/api';
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  RUBRO_LABELS,
  TIPO_TICKET_LABELS,
} from '../../types/tickets';
import type { EstadoTicket } from '../../types/tickets';

interface TicketTabHistorialProps {
  ticketId: number;
}

interface HistorialItem {
  id: number;
  fechaCambio: string;
  campoModificado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  observacion: string | null;
  usuario?: {
    nombre: string;
    apellido: string;
  };
}

// Event type config for timeline visuals
const EVENT_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; bgColor: string; lineColor: string }
> = {
  estado: {
    icon: ArrowRightLeft,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    lineColor: 'border-green-200 dark:border-green-800',
  },
  tecnicoId: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    lineColor: 'border-blue-200 dark:border-blue-800',
  },
  creacion: {
    icon: Plus,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    lineColor: 'border-emerald-200 dark:border-emerald-800',
  },
  eliminacion: {
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    lineColor: 'border-red-200 dark:border-red-800',
  },
  nota: {
    icon: MessageSquare,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    lineColor: 'border-indigo-200 dark:border-indigo-800',
  },
  ot_creacion: {
    icon: FileText,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    lineColor: 'border-cyan-200 dark:border-cyan-800',
  },
  ot_actualizacion: {
    icon: Settings,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    lineColor: 'border-cyan-200 dark:border-cyan-800',
  },
  ot_finalizacion: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    lineColor: 'border-green-200 dark:border-green-800',
  },
  ot_eliminacion: {
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    lineColor: 'border-red-200 dark:border-red-800',
  },
};

const DEFAULT_EVENT = {
  icon: PenLine,
  color: 'text-amber-600 dark:text-amber-400',
  bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  lineColor: 'border-amber-200 dark:border-amber-800',
};

export default function TicketTabHistorial({ ticketId }: TicketTabHistorialProps) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nota, setNota] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadHistorial();
  }, [ticketId]);

  const loadHistorial = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tickets/${ticketId}/historial`);
      setHistorial(res.data || []);
    } catch (error) {
      console.error('Error loading historial:', error);
      setHistorial([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNota = async () => {
    if (!nota.trim() || isSending) return;
    try {
      setIsSending(true);
      await api.post(`/tickets/${ticketId}/notas`, { contenido: nota.trim() });
      setNota('');
      await loadHistorial();
    } catch (error) {
      console.error('Error sending nota:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendNota();
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (campo: string, valor: string | null): string => {
    if (!valor) return '-';
    if (campo === 'estado') return ESTADO_LABELS[valor as keyof typeof ESTADO_LABELS] || valor;
    if (campo === 'rubro') return RUBRO_LABELS[valor as keyof typeof RUBRO_LABELS] || valor;
    if (campo === 'tipoTicket')
      return TIPO_TICKET_LABELS[valor as keyof typeof TIPO_TICKET_LABELS] || valor;
    return valor;
  };

  const getCampoLabel = (campo: string): string => {
    const labels: Record<string, string> = {
      estado: 'Estado',
      rubro: 'Rubro',
      tipoTicket: 'Tipo/SLA',
      descripcion: 'Descripcion',
      tecnicoId: 'Tecnico',
      sucursalId: 'Sucursal',
      fechaProgramada: 'Fecha Programada',
      codigoCliente: 'N Ticket Externo',
      trabajo: 'Trabajo Realizado',
      observaciones: 'Observaciones',
      ot_creacion: 'Orden de Trabajo',
      ot_actualizacion: 'Orden de Trabajo',
      ot_finalizacion: 'Orden de Trabajo',
      ot_eliminacion: 'Orden de Trabajo',
    };
    return labels[campo] || campo;
  };

  const getUserName = (item: HistorialItem) =>
    item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Sistema';

  const getEventConfig = (campo: string) => EVENT_CONFIG[campo] || DEFAULT_EVENT;

  // Renders the content block for each event type
  const renderEventContent = (item: HistorialItem) => {
    const userName = getUserName(item);

    // Notes - show as quote block
    if (item.campoModificado === 'nota') {
      return (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
            {' dejo una nota'}
          </p>
          {item.observacion && (
            <div className="mt-2 rounded-lg border-l-4 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500 px-4 py-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {item.observacion}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Creation - show with quoted description
    if (item.campoModificado === 'creacion') {
      return (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
            {' creo el ticket'}
          </p>
          {item.valorNuevo && (
            <div className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500 px-4 py-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">{item.valorNuevo}</p>
            </div>
          )}
        </div>
      );
    }

    // Estado change - show colored badges
    if (item.campoModificado === 'estado') {
      return (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
            {' cambio el estado'}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {item.valorAnterior && (
              <>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLORS[item.valorAnterior as EstadoTicket] || 'bg-slate-100 text-slate-600'}`}
                >
                  {formatValue('estado', item.valorAnterior)}
                </span>
                <span className="text-slate-400 text-xs">→</span>
              </>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLORS[item.valorNuevo as EstadoTicket] || 'bg-slate-100 text-slate-600'}`}
            >
              {formatValue('estado', item.valorNuevo)}
            </span>
          </div>
          {item.observacion && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              {item.observacion}
            </p>
          )}
        </div>
      );
    }

    // Tecnico assignment
    if (item.campoModificado === 'tecnicoId') {
      return (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
            {item.valorAnterior ? ' reasigno el tecnico' : ' asigno un tecnico'}
          </p>
          {item.observacion && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
              {item.observacion}
            </p>
          )}
        </div>
      );
    }

    // OT events - show with description block
    if (item.campoModificado.startsWith('ot_')) {
      const otLabels: Record<string, string> = {
        ot_creacion: 'creo una Orden de Trabajo',
        ot_actualizacion: 'actualizo la Orden de Trabajo',
        ot_finalizacion: 'finalizo la Orden de Trabajo',
        ot_eliminacion: 'elimino la Orden de Trabajo',
      };
      return (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>{' '}
            {otLabels[item.campoModificado] || 'modifico la OT'}
            {item.valorNuevo && (
              <span className="ml-1 font-medium text-cyan-600 dark:text-cyan-400">
                {item.valorNuevo}
              </span>
            )}
          </p>
          {item.observacion && (
            <div className="mt-2 rounded-lg border-l-4 border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-500 px-4 py-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">{item.observacion}</p>
            </div>
          )}
        </div>
      );
    }

    // Deletion
    if (item.campoModificado === 'eliminacion') {
      return (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
          {' elimino el ticket'}
        </p>
      );
    }

    // Generic field change
    const campo = getCampoLabel(item.campoModificado);
    return (
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{userName}</span>
          {` modifico ${campo}`}
        </p>
        {(item.valorAnterior || item.valorNuevo) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 line-through">
              {formatValue(item.campoModificado, item.valorAnterior)}
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
              {formatValue(item.campoModificado, item.valorNuevo)}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Actividad Reciente</h3>
        <span className="text-xs text-slate-400 ml-auto">
          {historial.length} {historial.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      {/* Timeline */}
      {historial.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay actividad registrada</p>
        </div>
      ) : (
        <div className="relative mb-4">
          {/* Timeline connector line */}
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-0">
            {historial.map((item, index) => {
              const config = getEventConfig(item.campoModificado);
              const IconComponent = config.icon;
              const isFirst = index === 0;

              return (
                <div
                  key={item.id}
                  className={`relative flex gap-3 py-3 ${isFirst ? 'bg-slate-50/50 dark:bg-slate-800/30 -mx-2 px-2 rounded-lg' : ''}`}
                >
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}
                  >
                    <IconComponent className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {renderEventContent(item)}

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(item.fechaCambio)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note input */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribir una nota o respuesta..."
              rows={1}
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSendNota}
            disabled={!nota.trim() || isSending}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          Enter para enviar, Shift+Enter para nueva linea
        </p>
      </div>
    </div>
  );
}
