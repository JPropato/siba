import { memo } from 'react';
import {
  Clock,
  ArrowRightLeft,
  UserPlus,
  PenLine,
  Plus,
  MessageSquare,
  Trash2,
  Activity,
} from 'lucide-react';

interface ActivityItem {
  id: number;
  ticketId: number;
  codigoInterno: number;
  campoModificado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  observacion: string | null;
  fechaCambio: string;
  usuario: { nombre: string; apellido: string };
}

interface Props {
  activities: ActivityItem[];
  onClickTicket: (id: number) => void;
}

const EVENT_ICON: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  estado: {
    icon: ArrowRightLeft,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  tecnicoId: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  creacion: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  eliminacion: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  nota: {
    icon: MessageSquare,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
};

const DEFAULT_ICON = {
  icon: PenLine,
  color: 'text-amber-600',
  bg: 'bg-amber-100 dark:bg-amber-900/30',
};

const ACTION_LABELS: Record<string, string> = {
  estado: 'cambió estado',
  tecnicoId: 'asignó técnico',
  creacion: 'creó ticket',
  eliminacion: 'eliminó ticket',
  nota: 'dejó una nota',
  descripcion: 'editó descripción',
  rubro: 'cambió rubro',
  tipoTicket: 'cambió tipo SLA',
  sucursalId: 'cambió sucursal',
  fechaProgramada: 'programó fecha',
  trabajo: 'editó trabajo',
  observaciones: 'editó observaciones',
};

function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export const RecentActivityList = memo(function RecentActivityList({
  activities,
  onClickTicket,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-brand" />
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Actividad Reciente
        </h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Sin actividad reciente</p>
      ) : (
        <div className="space-y-1">
          {activities.map((item) => {
            const config = EVENT_ICON[item.campoModificado] || DEFAULT_ICON;
            const Icon = config.icon;
            const action = ACTION_LABELS[item.campoModificado] || `editó ${item.campoModificado}`;

            return (
              <button
                key={item.id}
                onClick={() => onClickTicket(item.ticketId)}
                className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full ${config.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">
                      TKT-{String(item.codigoInterno).padStart(5, '0')}
                    </span>{' '}
                    <span className="text-slate-400">{action}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 truncate">
                      {item.usuario.nombre} {item.usuario.apellido}
                    </span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(item.fechaCambio)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
