import { useState, useEffect } from 'react';
import { Clock, User, ArrowRight } from 'lucide-react';
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (campo: string, valor: string | null): string => {
    if (!valor) return '-';

    // Formatear según el campo
    if (campo === 'estado') {
      return ESTADO_LABELS[valor as keyof typeof ESTADO_LABELS] || valor;
    }
    if (campo === 'rubro') {
      return RUBRO_LABELS[valor as keyof typeof RUBRO_LABELS] || valor;
    }
    if (campo === 'tipoTicket') {
      return TIPO_TICKET_LABELS[valor as keyof typeof TIPO_TICKET_LABELS] || valor;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">
          progress_activity
        </span>
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
    <div className="space-y-4">
      {historial.map((item) => (
        <div
          key={item.id}
          className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {formatDate(item.fechaCambio)}
            </div>
            {item.usuario && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <User className="h-4 w-4" />
                {item.usuario.nombre} {item.usuario.apellido}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getCampoLabel(item.campoModificado)}:
            </span>
            <span className="text-slate-500">
              {formatValue(item.campoModificado, item.valorAnterior)}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white">
              {formatValue(item.campoModificado, item.valorNuevo)}
            </span>
          </div>

          {item.observacion && (
            <p className="mt-2 text-sm text-slate-500 italic">{item.observacion}</p>
          )}
        </div>
      ))}
    </div>
  );
}
