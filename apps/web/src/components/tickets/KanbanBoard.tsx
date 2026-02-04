import { useMemo, useState, useEffect, useRef } from 'react';
import type { Ticket, EstadoTicket } from '../../types/tickets';
import { ESTADO_LABELS } from '../../types/tickets';
import KanbanColumn from './KanbanColumn';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  tickets: Ticket[];
  isLoading: boolean;
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticket: Ticket) => void;
}

// Orden de estados según flujo validado
const ESTADOS_ORDEN: EstadoTicket[] = [
  'NUEVO',
  'ASIGNADO',
  'EN_CURSO',
  'PENDIENTE_CLIENTE',
  'FINALIZADO',
];

export default function KanbanBoard({
  tickets,
  isLoading,
  onEditTicket,
  onDeleteTicket,
}: KanbanBoardProps) {
  const [announcement, setAnnouncement] = useState('');
  const previousTicketsRef = useRef<Ticket[]>([]);

  // Detectar cambios de estado de tickets y anunciarlos
  useEffect(() => {
    if (isLoading || tickets.length === 0) return;

    const previousTickets = previousTicketsRef.current;

    if (previousTickets.length > 0) {
      // Detectar tickets que cambiaron de estado
      tickets.forEach((currentTicket) => {
        const previousTicket = previousTickets.find((t) => t.id === currentTicket.id);

        if (previousTicket && previousTicket.estado !== currentTicket.estado) {
          const ticketCode = `TKT-${String(currentTicket.codigoInterno).padStart(5, '0')}`;
          const fromState = ESTADO_LABELS[previousTicket.estado];
          const toState = ESTADO_LABELS[currentTicket.estado];

          setAnnouncement(`Ticket ${ticketCode} movido de ${fromState} a ${toState}`);

          // Limpiar el anuncio después de 3 segundos
          setTimeout(() => setAnnouncement(''), 3000);
        }
      });
    }

    previousTicketsRef.current = [...tickets];
  }, [tickets, isLoading]);

  // Agrupar tickets por estado
  const ticketsByEstado = useMemo(() => {
    const grouped: Partial<Record<EstadoTicket, Ticket[]>> = {
      NUEVO: [],
      ASIGNADO: [],
      EN_CURSO: [],
      PENDIENTE_CLIENTE: [],
      FINALIZADO: [],
    };

    tickets.forEach((ticket) => {
      const stateList = grouped[ticket.estado];
      if (stateList) {
        stateList.push(ticket);
      }
    });

    return grouped;
  }, [tickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-9 w-9 text-gold animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen reader announcements for state changes - A11y */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max p-1">
          {ESTADOS_ORDEN.map((estado) => (
            <KanbanColumn
              key={estado}
              estado={estado}
              tickets={ticketsByEstado[estado] || []}
              onEditTicket={onEditTicket}
              onDeleteTicket={onDeleteTicket}
            />
          ))}
        </div>
      </div>
    </>
  );
}
