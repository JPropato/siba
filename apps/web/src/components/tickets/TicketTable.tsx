import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Eye, Trash2, Ticket } from 'lucide-react';
import { useActionSheet } from '../../hooks/useActionSheet';
import { MobileActionSheet } from '../ui/MobileActionSheet';
import { EmptyState } from '../ui/EmptyState';
import { SortableHeader } from '../ui/core/SortableHeader';
import type { Ticket as TicketType } from '../../types/tickets';
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  TIPO_TICKET_LABELS,
  TIPO_TICKET_COLORS,
  RUBRO_LABELS,
} from '../../types/tickets';
import api from '../../lib/api';

interface TicketTableProps {
  tickets: TicketType[];
  onViewDetail: (ticket: TicketType) => void;
  onDelete: (ticket: TicketType) => void;
  isLoading: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const formatCode = (code: number) => `TKT-${String(code).padStart(5, '0')}`;
const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function TicketTable({
  tickets,
  onViewDetail,
  onDelete,
  isLoading,
  sortBy,
  sortDir,
  onSort,
}: TicketTableProps) {
  const navigate = useNavigate();
  const actionSheet = useActionSheet<TicketType>();
  const queryClient = useQueryClient();

  // Prefetching en hover
  const handleMouseEnter = useCallback(
    (ticketId: number) => {
      const timeout = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ['ticket', ticketId],
          queryFn: () => api.get(`/tickets/${ticketId}`).then((r) => r.data),
          staleTime: 30 * 1000,
        });
      }, 150);
      return () => clearTimeout(timeout);
    },
    [queryClient]
  );

  // Sort adapter: convierte el SortableHeader interface a server-side sort
  const sortConfig = {
    key: (sortBy as keyof TicketType) ?? null,
    direction: sortDir ?? null,
  };

  const handleSort = (key: keyof TicketType) => {
    onSort?.(key as string);
  };

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-6 w-6 text-brand" />}
        title="Sin tickets"
        description="No se encontraron tickets con los filtros aplicados."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <SortableHeader<TicketType>
                label="Código"
                sortKey="codigoInterno"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader<TicketType>
                label="Fecha"
                sortKey="fechaCreacion"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="hidden md:table-cell"
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                Descripción
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                Sucursal
              </th>
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                Técnico
              </th>
              <SortableHeader<TicketType>
                label="Estado"
                sortKey="estado"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader<TicketType>
                label="Tipo"
                sortKey="tipoTicket"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="hidden sm:table-cell"
              />
              <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {tickets.map((t) => (
              <motion.tr
                key={t.id}
                className="bg-white dark:bg-slate-950 cursor-pointer"
                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={() => onViewDetail(t)}
                onDoubleClick={() => navigate(`/dashboard/tickets/${t.id}`)}
                onMouseEnter={() => handleMouseEnter(t.id)}
                {...actionSheet.getLongPressHandlers(t)}
              >
                <td className="px-3 py-2">
                  <div className="font-semibold text-brand text-xs tracking-wide">
                    {formatCode(t.codigoInterno)}
                  </div>
                  {t.codigoCliente && (
                    <div className="text-[10px] text-slate-400">{t.codigoCliente}</div>
                  )}
                </td>
                <td className="px-3 py-2 hidden md:table-cell text-slate-600 dark:text-slate-400 text-xs">
                  {formatDate(t.fechaCreacion)}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate text-sm">
                    {t.descripcion}
                  </div>
                  <div className="text-[10px] text-slate-400">{RUBRO_LABELS[t.rubro]}</div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <div className="text-slate-900 dark:text-white text-sm">
                    {t.sucursal?.nombre || '-'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t.sucursal?.cliente?.razonSocial || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 hidden lg:table-cell text-slate-600 dark:text-slate-400 text-sm">
                  {t.tecnico ? (
                    `${t.tecnico.nombre} ${t.tecnico.apellido}`
                  ) : (
                    <span className="text-slate-400 italic text-xs">Sin técnico</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ESTADO_COLORS[t.estado]}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {ESTADO_LABELS[t.estado]}
                  </span>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_TICKET_COLORS[t.tipoTicket]}`}
                  >
                    {TIPO_TICKET_LABELS[t.tipoTicket]}
                  </span>
                </td>
                <td className="px-2 py-1 text-right hidden sm:table-cell">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onViewDetail(t)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                      title="Ver detalle"
                      aria-label="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileActionSheet
        open={actionSheet.isOpen}
        onClose={actionSheet.close}
        title={
          actionSheet.selectedItem
            ? `${formatCode(actionSheet.selectedItem.codigoInterno)} - ${actionSheet.selectedItem.descripcion}`
            : undefined
        }
        actions={[
          {
            id: 'view',
            label: 'Ver detalle',
            icon: <Eye className="h-5 w-5" />,
            onClick: () => actionSheet.selectedItem && onViewDetail(actionSheet.selectedItem),
          },
          {
            id: 'delete',
            label: 'Eliminar',
            icon: <Trash2 className="h-5 w-5" />,
            variant: 'destructive',
            onClick: () => actionSheet.selectedItem && onDelete(actionSheet.selectedItem),
          },
        ]}
      />
    </div>
  );
}
