import type { Ticket } from '../../types/tickets';
import { TIPO_TICKET_LABELS, TIPO_TICKET_COLORS, RUBRO_LABELS } from '../../types/tickets';
import { Building2, Wrench, Pencil, Trash2 } from 'lucide-react';

interface KanbanCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export default function KanbanCard({ ticket, onEdit, onDelete }: KanbanCardProps) {
  const formatCode = (code: number) => `TKT-${String(code).padStart(5, '0')}`;

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getTecnicoInitials = () => {
    if (!ticket.tecnico) return null;
    return `${ticket.tecnico.nombre.charAt(0)}${ticket.tecnico.apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div
      className="group bg-white dark:bg-charcoal/30 rounded-xl border border-[#e5e5e3] dark:border-[#37322a] p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/30"
      onClick={() => onEdit(ticket)}
    >
      {/* Header: Código + Tipo Ticket (SLA) */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold text-gold">
          {formatCode(ticket.codigoInterno)}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPO_TICKET_COLORS[ticket.tipoTicket]}`}
        >
          {TIPO_TICKET_LABELS[ticket.tipoTicket]}
        </span>
      </div>

      {/* Descripción */}
      <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 mb-3">
        {ticket.descripcion}
      </p>

      {/* Cliente / Sucursal */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <Building2 className="h-3.5 w-3.5" />
        <span className="truncate">
          {ticket.sucursal?.cliente?.razonSocial || ticket.sucursal?.nombre || 'Sin asignar'}
        </span>
      </div>

      {/* Rubro Tag */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <Wrench className="h-3.5 w-3.5" />
        <span>{RUBRO_LABELS[ticket.rubro]}</span>
      </div>

      {/* Footer: Técnico + Fecha + Acciones */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {ticket.tecnico ? (
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-[10px] font-bold">
                {getTecnicoInitials()}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                {ticket.tecnico.nombre}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Sin técnico</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {ticket.fechaCreacion && (
            <span className="text-[10px] text-slate-400 mr-2">
              {formatDate(ticket.fechaCreacion)}
            </span>
          )}

          {/* Acciones visibles en hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(ticket);
              }}
              className="p-1 text-slate-400 hover:text-gold hover:bg-gold/10 rounded transition-colors"
              title="Editar"
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ticket);
              }}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Eliminar"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
