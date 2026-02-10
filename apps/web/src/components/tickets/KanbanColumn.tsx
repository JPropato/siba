import { memo, useRef, useEffect, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { Ticket, EstadoTicket } from '../../types/tickets';
import { ESTADO_LABELS, esTransicionValida } from '../../types/tickets';
import KanbanCard from './KanbanCard';
import { Sparkles, UserPlus, Wrench, Clock, CheckCircle, Ban, Inbox } from 'lucide-react';

interface KanbanColumnProps {
  estado: EstadoTicket;
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticket: Ticket) => void;
  onAssignTicket?: (ticket: Ticket) => void;
}

const COLUMN_COLORS: Record<EstadoTicket, { border: string; bg: string; text: string }> = {
  NUEVO: {
    border: 'border-t-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  },
  ASIGNADO: {
    border: 'border-t-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  EN_CURSO: {
    border: 'border-t-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  PENDIENTE_CLIENTE: {
    border: 'border-t-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
  },
  FINALIZADO: {
    border: 'border-t-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  CANCELADO: {
    border: 'border-t-slate-300',
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
  },
};

const COLUMN_ICONS: Record<EstadoTicket, React.ElementType> = {
  NUEVO: Sparkles,
  ASIGNADO: UserPlus,
  EN_CURSO: Wrench,
  PENDIENTE_CLIENTE: Clock,
  FINALIZADO: CheckCircle,
  CANCELADO: Ban,
};

/**
 * KanbanColumn - Memoizado para evitar re-renders cuando otras columnas cambian.
 * Drop target para pragmatic-drag-and-drop.
 */
const KanbanColumn = memo(function KanbanColumn({
  estado,
  tickets,
  onEditTicket,
  onDeleteTicket,
  onAssignTicket,
}: KanbanColumnProps) {
  const colors = COLUMN_COLORS[estado];
  const IconComponent = COLUMN_ICONS[estado];
  const columnRef = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ estado }),
      canDrop: ({ source }) => {
        const sourceEstado = source.data.estado as EstadoTicket;
        return sourceEstado !== estado && esTransicionValida(sourceEstado, estado);
      },
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    });
  }, [estado]);

  return (
    <div
      ref={columnRef}
      className={`flex flex-col w-80 min-w-[320px] rounded-xl border border-t-4 transition-all duration-200 ${
        isDraggedOver
          ? `bg-gold/5 dark:bg-gold/10 border-gold/40 dark:border-gold/30 ring-2 ring-gold/30 ${colors.border}`
          : `bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 ${colors.border}`
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-5 w-5 ${colors.text}`} />
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
            <Inbox className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">{isDraggedOver ? 'Soltar aquí' : 'Sin tickets'}</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onEdit={onEditTicket}
              onDelete={onDeleteTicket}
              onAssign={onAssignTicket}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default KanbanColumn;
