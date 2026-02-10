import { useMemo, useState, useEffect, useRef } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { toast } from 'sonner';
import type { Ticket, EstadoTicket } from '../../types/tickets';
import { ESTADO_LABELS, esTransicionValida } from '../../types/tickets';
import { useUpdateTicketEstado } from '../../hooks/api/useTickets';
import KanbanColumn from './KanbanColumn';
import InlineTecnicoAssigner from './InlineTecnicoAssigner';
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
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const previousTicketsRef = useRef<Ticket[]>([]);
  const updateEstado = useUpdateTicketEstado();

  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;

  const onEditTicketRef = useRef(onEditTicket);
  onEditTicketRef.current = onEditTicket;

  // Monitor global de drag-and-drop
  useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const ticketId = source.data.ticketId as number;
        const sourceEstado = source.data.estado as EstadoTicket;
        const targetEstado = destination.data.estado as EstadoTicket;

        if (sourceEstado === targetEstado) return;
        if (!esTransicionValida(sourceEstado, targetEstado)) return;

        const ticket = ticketsRef.current.find((t) => t.id === ticketId);
        if (!ticket) return;

        // NUEVO → ASIGNADO requiere técnico: mostrar selector inline
        if (sourceEstado === 'NUEVO' && targetEstado === 'ASIGNADO') {
          if (ticket.tecnicoId) {
            // Ya tiene técnico, transicionar directo
            updateEstado.mutate(
              { id: ticketId, estado: targetEstado },
              {
                onSuccess: () => {
                  const code = `TKT-${String(ticket.codigoInterno).padStart(5, '0')}`;
                  toast.success(`${code} movido a ${ESTADO_LABELS[targetEstado]}`);
                },
                onError: () => toast.error('Error al mover ticket'),
              }
            );
          } else {
            setAssigningTicket(ticket);
          }
          return;
        }

        const ticketCode = `TKT-${String(ticket.codigoInterno).padStart(5, '0')}`;
        updateEstado.mutate(
          { id: ticketId, estado: targetEstado },
          {
            onSuccess: () => {
              toast.success(`${ticketCode} movido a ${ESTADO_LABELS[targetEstado]}`);
            },
            onError: () => {
              toast.error(`Error al mover ${ticketCode}`);
            },
          }
        );
      },
    });
  }, [updateEstado]);

  // Detectar cambios de estado de tickets y anunciarlos
  useEffect(() => {
    if (isLoading || tickets.length === 0) return;

    const previousTickets = previousTicketsRef.current;

    if (previousTickets.length > 0) {
      tickets.forEach((currentTicket) => {
        const previousTicket = previousTickets.find((t) => t.id === currentTicket.id);

        if (previousTicket && previousTicket.estado !== currentTicket.estado) {
          const ticketCode = `TKT-${String(currentTicket.codigoInterno).padStart(5, '0')}`;
          const fromState = ESTADO_LABELS[previousTicket.estado];
          const toState = ESTADO_LABELS[currentTicket.estado];

          setAnnouncement(`Ticket ${ticketCode} movido de ${fromState} a ${toState}`);

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
              onAssignTicket={(ticket) => setAssigningTicket(ticket)}
            />
          ))}
        </div>
      </div>

      {/* Inline Technician Assignment Popover */}
      {assigningTicket && (
        <div className="fixed inset-0 z-[199] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <InlineTecnicoAssigner
            ticketId={assigningTicket.id}
            ticketCode={`TKT-${String(assigningTicket.codigoInterno).padStart(5, '0')}`}
            currentTecnicoId={assigningTicket.tecnicoId}
            onSuccess={() => setAssigningTicket(null)}
            onCancel={() => setAssigningTicket(null)}
          />
        </div>
      )}
    </>
  );
}
