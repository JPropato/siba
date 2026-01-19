import type { Ticket, EstadoTicket } from '../../types/tickets';
import { ESTADO_LABELS } from '../../types/tickets';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  estado: EstadoTicket;
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticket: Ticket) => void;
}

const COLUMN_COLORS: Record<EstadoTicket, { border: string; bg: string; text: string }> = {
  NUEVO: {
    border: 'border-t-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  },
  PROGRAMADO: {
    border: 'border-t-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  EN_CURSO: {
    border: 'border-t-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  FINALIZADO: {
    border: 'border-t-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
};

const COLUMN_ICONS: Record<EstadoTicket, string> = {
  NUEVO: 'fiber_new',
  PROGRAMADO: 'schedule',
  EN_CURSO: 'engineering',
  FINALIZADO: 'check_circle',
};

export default function KanbanColumn({
  estado,
  tickets,
  onEditTicket,
  onDeleteTicket,
}: KanbanColumnProps) {
  const colors = COLUMN_COLORS[estado];

  return (
    <div
      className={`flex flex-col w-80 min-w-[320px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 border-t-4 ${colors.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[20px] ${colors.text}`}>
            {COLUMN_ICONS[estado]}
          </span>
          <h3 className="font-semibold text-slate-900 dark:text-white">{ESTADO_LABELS[estado]}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
          {tickets.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">inbox</span>
            <p className="text-xs">Sin tickets</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onEdit={onEditTicket}
              onDelete={onDeleteTicket}
            />
          ))
        )}
      </div>
    </div>
  );
}
