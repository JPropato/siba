import {
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  RefreshCw,
  XCircle,
  CheckCircle,
  FileText,
  User,
} from 'lucide-react';
import type { EventoAuditoria } from '../api/auditApi';

interface AuditTableProps {
  eventos: EventoAuditoria[];
}

const ACCION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  CREAR: {
    icon: <Plus className="h-3.5 w-3.5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  ACTUALIZAR: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  ELIMINAR: {
    icon: <Trash2 className="h-3.5 w-3.5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  CAMBIO_ESTADO: {
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  TRANSFERENCIA: {
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  ANULAR: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  CONFIRMAR: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  GENERAR_PDF: {
    icon: <FileText className="h-3.5 w-3.5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  LOGIN: {
    icon: <LogIn className="h-3.5 w-3.5" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
  },
  LOGOUT: {
    icon: <LogOut className="h-3.5 w-3.5" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
};

const ACCION_LABELS: Record<string, string> = {
  CREAR: 'Crear',
  ACTUALIZAR: 'Actualizar',
  ELIMINAR: 'Eliminar',
  CAMBIO_ESTADO: 'Cambio Estado',
  TRANSFERENCIA: 'Transferencia',
  ANULAR: 'Anular',
  CONFIRMAR: 'Confirmar',
  GENERAR_PDF: 'Generar PDF',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

const MODULO_LABELS: Record<string, string> = {
  auth: 'Auth',
  tickets: 'Tickets',
  obras: 'Obras',
  finanzas: 'Finanzas',
  clientes: 'Clientes',
  sedes: 'Sedes',
  zonas: 'Zonas',
  vehiculos: 'Vehículos',
  materiales: 'Materiales',
  empleados: 'Empleados',
  usuarios: 'Usuarios',
  roles: 'Roles',
  ordenes_trabajo: 'OT',
};

const formatDateTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
};

export default function AuditTable({ eventos }: AuditTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">Fecha</th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Usuario
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">Acción</th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell">
                Módulo
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Descripción
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {eventos.map((ev) => {
              const accionConfig = ACCION_CONFIG[ev.accion] || {
                icon: <Pencil className="h-3.5 w-3.5" />,
                color: 'text-slate-500',
                bgColor: 'bg-slate-100',
              };

              return (
                <tr
                  key={ev.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDateTime(ev.fechaEvento)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(ev.fechaEvento)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {ev.usuario.nombre} {ev.usuario.apellido}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:block">
                          {ev.usuario.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${accionConfig.color} ${accionConfig.bgColor}`}
                    >
                      {accionConfig.icon}
                      {ACCION_LABELS[ev.accion] || ev.accion}
                    </span>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {MODULO_LABELS[ev.modulo] || ev.modulo}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                      {ev.descripcion}
                    </span>
                    {ev.entidadTipo && ev.entidadId && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        {ev.entidadTipo} #{ev.entidadId}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <span className="text-[10px] font-mono text-slate-400">{ev.ip || '-'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
