import { memo } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { TIPO_TICKET_COLORS, ESTADO_LABELS, TIPO_TICKET_LABELS } from '../../types/tickets';

interface UrgentTicket {
  id: number;
  codigoInterno: number;
  descripcion: string;
  tipoTicket: string;
  estado: string;
  fechaCreacion: string;
  diasAbiertos: number;
  sucursal: { nombre: string };
}

interface Props {
  tickets: UrgentTicket[];
  onClickTicket: (id: number) => void;
}

// SLA limits in days
const SLA_DAYS: Record<string, number> = {
  SEA: 1,
  SEP: 7,
  SN: 15,
};

export const UrgentTicketsList = memo(function UrgentTicketsList({
  tickets,
  onClickTicket,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Tickets Urgentes
        </h3>
      </div>

      {tickets.length === 0 ? (
        <div className="py-8 text-center">
          <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay tickets urgentes abiertos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const slaLimit = SLA_DAYS[ticket.tipoTicket] || 15;
            const overSLA = ticket.diasAbiertos > slaLimit;
            const tipoColors =
              TIPO_TICKET_COLORS[ticket.tipoTicket as keyof typeof TIPO_TICKET_COLORS] || '';

            return (
              <button
                key={ticket.id}
                onClick={() => onClickTicket(ticket.id)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    TKT-{String(ticket.codigoInterno).padStart(5, '0')}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tipoColors}`}>
                    {TIPO_TICKET_LABELS[ticket.tipoTicket as keyof typeof TIPO_TICKET_LABELS] ||
                      ticket.tipoTicket}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {ESTADO_LABELS[ticket.estado as keyof typeof ESTADO_LABELS] || ticket.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                  {ticket.descripcion}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400 truncate max-w-[60%]">
                    {ticket.sucursal.nombre}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      overSLA ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                    }`}
                  >
                    {ticket.diasAbiertos}d {overSLA && '(vencido)'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
