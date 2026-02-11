import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Download, Copy, Check, MapPin, Loader2, FileText, AlertCircle } from 'lucide-react';
import { DialogBase } from '../ui/core/DialogBase';
import { Select } from '../ui/core/Select';
import { Button } from '../ui/core/Button';
import api from '../../lib/api';
import { ESTADO_LABELS, TIPO_TICKET_LABELS } from '../../types/tickets';
import type { EstadoTicket, TipoTicket } from '../../types/tickets';

interface Zona {
  id: number;
  nombre: string;
  codigo: number;
}

interface PendienteTicket {
  id: number;
  codigoInterno: number;
  descripcion: string;
  sucursal: string;
  cliente: string;
  tecnico: string | null;
  estado: EstadoTicket;
  tipoTicket: TipoTicket;
  rubro: string;
  fechaCreacion: string;
}

interface PendientesResponse {
  zona: { id: number; nombre: string; codigo: number };
  fecha: string;
  tickets: PendienteTicket[];
  totales: {
    nuevo: number;
    asignado: number;
    enCurso: number;
    pendienteCliente: number;
    total: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const estadoEmojis: Record<string, string> = {
  NUEVO: '🆕',
  ASIGNADO: '🔵',
  EN_CURSO: '🟡',
  PENDIENTE_CLIENTE: '🟣',
};

const prioridadEmojis: Record<string, string> = {
  SEA: '🔴',
  SEP: '🟠',
  SN: '🟢',
};

function calcularVencimientoSLA(fechaCreacion: string, tipoTicket: TipoTicket): Date {
  const fecha = new Date(fechaCreacion);
  if (tipoTicket === 'SEA') {
    // Fin del día hábil siguiente
    const next = new Date(fecha);
    next.setDate(next.getDate() + 1);
    // Skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    next.setHours(23, 59, 59);
    return next;
  } else if (tipoTicket === 'SEP') {
    // 7 días corridos
    const deadline = new Date(fecha);
    deadline.setDate(deadline.getDate() + 7);
    return deadline;
  }
  // SN: 15 días corridos
  const deadline = new Date(fecha);
  deadline.setDate(deadline.getDate() + 15);
  return deadline;
}

function formatDateAR(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const estadoBadgeColors: Record<string, string> = {
  NUEVO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  ASIGNADO: 'bg-amber-50 text-amber-700/80 dark:bg-amber-950/30 dark:text-amber-400/80',
  EN_CURSO: 'bg-sky-50 text-sky-700/80 dark:bg-sky-950/30 dark:text-sky-400/80',
  PENDIENTE_CLIENTE: 'bg-rose-50 text-rose-600/80 dark:bg-rose-950/30 dark:text-rose-400/80',
};

export default function EnviarPendientesDialog({ isOpen, onClose }: Props) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState('');
  const [data, setData] = useState<PendientesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingZonas, setIsLoadingZonas] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load zonas on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingZonas(true);
      api
        .get('/zones?limit=1000')
        .then((res) => setZonas(res.data.data || res.data || []))
        .catch(() => toast.error('Error al cargar zonas'))
        .finally(() => setIsLoadingZonas(false));
    }
  }, [isOpen]);

  // Load tickets when zona changes
  useEffect(() => {
    if (!selectedZonaId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    api
      .get(`/tickets/pendientes-zona/${selectedZonaId}`)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Error al cargar tickets pendientes'))
      .finally(() => setIsLoading(false));
  }, [selectedZonaId]);

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedZonaId) return;

    try {
      const res = await api.get(`/tickets/pendientes-zona/${selectedZonaId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = res.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      link.download = filenameMatch?.[1] || 'pendientes.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF descargado');
    } catch {
      toast.error('Error al descargar PDF');
    }
  }, [selectedZonaId]);

  const generateWhatsAppText = useCallback((): string => {
    if (!data) return '';

    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let text = `📋 *TICKETS PENDIENTES - ZONA ${data.zona.nombre.toUpperCase()}*\n`;
    text += `📅 Fecha: ${fecha}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🆕 Nuevo: ${data.totales.nuevo} | 🔵 Asignado: ${data.totales.asignado} | 🟡 En Curso: ${data.totales.enCurso} | 🟣 Pend. Cliente: ${data.totales.pendienteCliente}\n`;
    text += `*Total: ${data.totales.total} tickets*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;

    for (const ticket of data.tickets) {
      const codigo = `TKT-${String(ticket.codigoInterno).padStart(5, '0')}`;
      const tipoLabel = TIPO_TICKET_LABELS[ticket.tipoTicket] || ticket.tipoTicket;
      const estadoLabel = ESTADO_LABELS[ticket.estado] || ticket.estado;
      const emoji = estadoEmojis[ticket.estado] || '⬜';
      const prioEmoji = prioridadEmojis[ticket.tipoTicket] || '⬜';

      const fechaCreacion = new Date(ticket.fechaCreacion);
      const fechaCreacionStr = formatDateAR(fechaCreacion);
      const vencimiento = calcularVencimientoSLA(ticket.fechaCreacion, ticket.tipoTicket);
      const vencimientoStr = formatDateAR(vencimiento);
      const vencido = new Date() > vencimiento;

      text += `\n${prioEmoji} *${codigo}* | ${tipoLabel}\n`;
      text += `📍 ${ticket.sucursal} - ${ticket.cliente}\n`;

      const desc =
        ticket.descripcion.length > 80
          ? ticket.descripcion.substring(0, 77) + '...'
          : ticket.descripcion;
      text += `📝 ${desc}\n`;

      text += `📅 Creado: ${fechaCreacionStr}\n`;
      text += `⏰ Vence: ${vencimientoStr}${vencido ? ' ⚠️ *VENCIDO*' : ''}\n`;
      text += `👷 ${ticket.tecnico ? `Técnico: ${ticket.tecnico}` : 'Sin técnico asignado'}\n`;
      text += `${emoji} Estado: ${estadoLabel}\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━\n`;
    text += `_Generado por SIBA_`;

    return text;
  }, [data]);

  const handleCopyWhatsApp = useCallback(async () => {
    const text = generateWhatsAppText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Texto copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  }, [generateWhatsAppText]);

  const handleClose = () => {
    setSelectedZonaId('');
    setData(null);
    setCopied(false);
    onClose();
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar Tickets Pendientes"
      description="Selecciona una zona para ver y enviar los tickets pendientes"
      maxWidth="4xl"
      icon={
        <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-brand" />
        </div>
      }
      footer={
        data && data.tickets.length > 0 ? (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadPDF}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Descargar PDF
            </Button>
            <Button
              onClick={handleCopyWhatsApp}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copiado' : 'Copiar para WhatsApp'}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5 min-h-[350px]">
        {/* Zona selector */}
        <Select
          label="Zona"
          value={selectedZonaId}
          onChange={setSelectedZonaId}
          options={[
            { value: '', label: isLoadingZonas ? 'Cargando zonas...' : 'Seleccionar zona' },
            ...zonas.map((z) => ({
              value: z.id.toString(),
              label: z.nombre,
            })),
          ]}
          icon={<MapPin className="h-4 w-4" />}
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        )}

        {/* No zona selected */}
        {!selectedZonaId && !isLoading && (
          <div className="text-center py-12 text-slate-400">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Selecciona una zona para ver los tickets pendientes</p>
          </div>
        )}

        {/* Data loaded */}
        {data && !isLoading && (
          <>
            {/* Totales badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Nuevo', count: data.totales.nuevo, estado: 'NUEVO' },
                { label: 'Asignado', count: data.totales.asignado, estado: 'ASIGNADO' },
                { label: 'En Curso', count: data.totales.enCurso, estado: 'EN_CURSO' },
                {
                  label: 'Pend. Cliente',
                  count: data.totales.pendienteCliente,
                  estado: 'PENDIENTE_CLIENTE',
                },
              ].map((item) => (
                <span
                  key={item.estado}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${estadoBadgeColors[item.estado]}`}
                >
                  {item.label}: {item.count}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Total: {data.totales.total}
              </span>
            </div>

            {/* Empty state */}
            {data.tickets.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No hay tickets pendientes en esta zona</p>
              </div>
            )}

            {/* Tickets table */}
            {data.tickets.length > 0 && (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Sucursal
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Técnico
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Vence SLA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          TKT-{String(ticket.codigoInterno).padStart(5, '0')}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">
                          {formatDateAR(new Date(ticket.fechaCreacion))}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {ticket.descripcion}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 hidden md:table-cell max-w-[150px] truncate">
                          {ticket.sucursal}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 hidden lg:table-cell">
                          {ticket.tecnico || (
                            <span className="text-slate-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${estadoBadgeColors[ticket.estado] || ''}`}
                          >
                            {ESTADO_LABELS[ticket.estado]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">
                          {TIPO_TICKET_LABELS[ticket.tipoTicket]}
                        </td>
                        {(() => {
                          const venc = calcularVencimientoSLA(
                            ticket.fechaCreacion,
                            ticket.tipoTicket
                          );
                          const vencido = new Date() > venc;
                          return (
                            <td
                              className={`px-3 py-2 text-xs hidden md:table-cell whitespace-nowrap ${vencido ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'}`}
                            >
                              {formatDateAR(venc)}
                              {vencido && <span className="ml-1 text-[10px]">VENCIDO</span>}
                            </td>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DialogBase>
  );
}
