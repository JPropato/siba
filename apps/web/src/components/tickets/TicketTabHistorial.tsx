import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Clock, User, ArrowRightLeft, UserPlus, PenLine, Plus } from 'lucide-react';
import api from '../../lib/api';
import { ESTADO_LABELS, RUBRO_LABELS, TIPO_TICKET_LABELS } from '../../types/tickets';

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
const EVENT_CONFIG: Record<string, { icon: typeof Clock; color: string; bgColor: string }> = {
  estado: {
    icon: ArrowRightLeft,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  tecnicoId: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  creacion: {
    icon: Plus,
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
};

const DEFAULT_EVENT = {
  icon: PenLine,
  color: 'text-amber-600 dark:text-amber-400',
  bgColor: 'bg-amber-100 dark:bg-amber-900/30',
};

export default function TicketTabHistorial({ ticketId }: TicketTabHistorialProps) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      descripcion: 'Descripción',
      tecnicoId: 'Técnico',
      sucursalId: 'Sucursal',
      fechaProgramada: 'Fecha Programada',
      codigoCliente: 'N° Ticket Externo',
    };
    return labels[campo] || campo;
  };

  const getEventDescription = (item: HistorialItem): string => {
    const userName = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Sistema';

    if (item.campoModificado === 'estado') {
      const nuevoEstado = formatValue('estado', item.valorNuevo);
      return `${userName} cambió el estado a ${nuevoEstado}`;
    }
    if (item.campoModificado === 'tecnicoId') {
      if (!item.valorAnterior) return `${userName} asignó un técnico`;
      return `${userName} reasignó el técnico`;
    }

    const campo = getCampoLabel(item.campoModificado);
    return `${userName} modificó ${campo}`;
  };

  const getEventConfig = (campo: string) => {
    return EVENT_CONFIG[campo] || DEFAULT_EVENT;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No hay historial de cambios</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline connector line */}
      <div className="absolute left-5 top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-700" />

      <div className="space-y-1">
        {historial.map((item) => {
          const config = getEventConfig(item.campoModificado);
          const IconComponent = config.icon;

          return (
            <div key={item.id} className="relative flex gap-4 py-3">
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
              >
                <IconComponent className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {getEventDescription(item)}
                </p>

                {/* Value change detail */}
                {item.campoModificado !== 'estado' &&
                  item.campoModificado !== 'tecnicoId' &&
                  (item.valorAnterior || item.valorNuevo) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatValue(item.campoModificado, item.valorAnterior)} →{' '}
                      {formatValue(item.campoModificado, item.valorNuevo)}
                    </p>
                  )}

                {item.campoModificado === 'estado' && item.valorAnterior && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatValue('estado', item.valorAnterior)} →{' '}
                    {formatValue('estado', item.valorNuevo)}
                  </p>
                )}

                {item.observacion && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                    {item.observacion}
                  </p>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(item.fechaCambio)}
                  </span>
                  {item.usuario && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.usuario.nombre} {item.usuario.apellido}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
