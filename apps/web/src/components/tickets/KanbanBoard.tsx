import { useMemo } from 'react';
import type { Ticket, EstadoTicket } from '../../types/tickets';
import KanbanColumn from './KanbanColumn';

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
          <span className="material-symbols-outlined text-4xl text-gold animate-spin">
            progress_activity
          </span>
          <p className="text-slate-500 dark:text-slate-400">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}
