import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  X,
  FileText,
  DollarSign,
  Wrench,
  Paperclip,
  History,
  ChevronDown,
  Check,
} from 'lucide-react';
import api from '../../lib/api';
import type { Ticket, EstadoTicket } from '../../types/tickets';
import { ESTADO_LABELS, ESTADO_COLORS, TRANSICIONES_VALIDAS } from '../../types/tickets';
import TicketTabGeneral from './TicketTabGeneral';
import TicketTabOT from './TicketTabOT';
import TicketTabArchivos from './TicketTabArchivos';
import TicketTabHistorial from './TicketTabHistorial';

interface TicketDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  onSuccess: () => void;
}

type TabId = 'general' | 'gastos' | 'ot' | 'archivos' | 'historial';

// Labels y colores para cada transición
const TRANSICION_CONFIG: Record<EstadoTicket, { label: string; color: string }> = {
  NUEVO: { label: 'Volver a Nuevo', color: 'text-slate-600' },
  ASIGNADO: { label: 'Asignar', color: 'text-blue-600' },
  EN_CURSO: { label: 'Iniciar Trabajo', color: 'text-amber-600' },
  PENDIENTE_CLIENTE: { label: 'Pendiente Cliente', color: 'text-purple-600' },
  FINALIZADO: { label: 'Finalizar', color: 'text-green-600' },
  CANCELADO: { label: 'Cancelar', color: 'text-red-600' },
};

// Obtiene las transiciones permitidas usando TRANSICIONES_VALIDAS de shared
const getTransicionesDisponibles = (estadoActual: EstadoTicket) => {
  const estadosPermitidos = TRANSICIONES_VALIDAS[estadoActual] || [];
  return estadosPermitidos.map((estado) => ({
    estado,
    ...TRANSICION_CONFIG[estado],
  }));
};

export default function TicketDetailSheet({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}: TicketDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);

  // Load ticket detail
  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket(ticketId);
    } else {
      setTicket(null);
      setActiveTab('general');
    }
  }, [isOpen, ticketId]);

  const loadTicket = async (id: number) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Error al cargar el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoTicket) => {
    if (!ticket) return;

    try {
      setIsLoading(true);
      setShowEstadoDropdown(false);
      await api.patch(`/tickets/${ticket.id}/estado`, { estado: nuevoEstado });
      await loadTicket(ticket.id);
      onSuccess();
      toast.success(`Estado actualizado a ${ESTADO_LABELS[nuevoEstado]}`);
    } catch (error: unknown) {
      console.error('Error changing estado:', error);
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al cambiar el estado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCode = (code: number) => `TKT-${String(code).padStart(5, '0')}`;

  const tabs = [
    { id: 'general' as const, label: 'Datos Generales', icon: FileText },
    { id: 'gastos' as const, label: 'Gastos', icon: DollarSign },
    { id: 'ot' as const, label: 'OT', icon: Wrench },
    { id: 'archivos' as const, label: 'Archivos', icon: Paperclip },
    { id: 'historial' as const, label: 'Historial', icon: History },
  ];

  const getTransicionesPermitidas = () => {
    if (!ticket) return [];
    return getTransicionesDisponibles(ticket.estado);
  };

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-3xl z-[101] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-brand">confirmation_number</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {ticket ? formatCode(ticket.codigoInterno) : 'Cargando...'}
                </h2>
                {ticket?.sucursal && (
                  <p className="text-sm text-slate-500">
                    {ticket.sucursal.cliente?.razonSocial} - {ticket.sucursal.nombre}
                  </p>
                )}
              </div>
            </div>

            {/* Estado Badge con Dropdown */}
            {ticket && (
              <div className="relative">
                <button
                  onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                  disabled={isLoading || getTransicionesPermitidas().length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${ESTADO_COLORS[ticket.estado]} ${getTransicionesPermitidas().length > 0 ? 'hover:opacity-80 cursor-pointer' : ''}`}
                >
                  {ESTADO_LABELS[ticket.estado]}
                  {getTransicionesPermitidas().length > 0 && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Dropdown Menu */}
                {showEstadoDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEstadoDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                      <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        Cambiar estado a:
                      </div>
                      {getTransicionesPermitidas().map((transicion) => (
                        <button
                          key={transicion.estado}
                          onClick={() => {
                            if (confirm(`¿${transicion.label}?`)) {
                              handleCambiarEstado(transicion.estado);
                            } else {
                              setShowEstadoDropdown(false);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 ${transicion.color}`}
                        >
                          <Check className="h-4 w-4 opacity-0" />
                          {transicion.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">
                progress_activity
              </span>
            </div>
          ) : !ticket ? (
            <div className="text-center py-12 text-slate-400">No se encontró el ticket</div>
          ) : activeTab === 'general' ? (
            <TicketTabGeneral
              ticket={ticket}
              onUpdate={() => loadTicket(ticket.id)}
              onSuccess={onSuccess}
            />
          ) : activeTab === 'gastos' ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Gastos</p>
              <p className="text-sm">Próximamente</p>
            </div>
          ) : activeTab === 'ot' ? (
            <TicketTabOT
              ticket={ticket}
              onSuccess={() => {
                loadTicket(ticket.id);
                onSuccess();
              }}
            />
          ) : activeTab === 'archivos' ? (
            <TicketTabArchivos ticketId={ticket.id} />
          ) : activeTab === 'historial' ? (
            <TicketTabHistorial ticketId={ticket.id} />
          ) : null}
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
