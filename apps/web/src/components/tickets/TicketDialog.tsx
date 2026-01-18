import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import type { Ticket, TicketFormData, RubroTicket, PrioridadTicket } from '../../types/tickets';
import { RUBRO_LABELS, PRIORIDAD_LABELS } from '../../types/tickets';

interface Sucursal {
  id: number;
  nombre: string;
  cliente?: { razonSocial: string };
}

interface Tecnico {
  id: number;
  nombre: string;
  apellido: string;
}

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TicketFormData) => Promise<void>;
  initialData?: Ticket | null;
}

export default function TicketDialog({ isOpen, onClose, onSave, initialData }: TicketDialogProps) {
  const [codigoCliente, setCodigoCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [trabajo, setTrabajo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [rubro, setRubro] = useState<RubroTicket>('CIVIL');
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('PROGRAMADO');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [sucursalId, setSucursalId] = useState<number | ''>('');
  const [tecnicoId, setTecnicoId] = useState<number | ''>('');

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      Promise.all([api.get('/sedes?limit=100'), api.get('/empleados?limit=100')])
        .then(([sedesRes, empleadosRes]) => {
          setSucursales(sedesRes.data.data || []);
          // Filter only TECNICO type employees
          const allEmpleados = empleadosRes.data.data || [];
          setTecnicos(allEmpleados.filter((e: { tipo: string }) => e.tipo === 'TECNICO'));
        })
        .catch(console.error)
        .finally(() => setIsFetching(false));

      if (initialData) {
        setCodigoCliente(initialData.codigoCliente || '');
        setDescripcion(initialData.descripcion);
        setTrabajo(initialData.trabajo || '');
        setObservaciones(initialData.observaciones || '');
        setRubro(initialData.rubro);
        setPrioridad(initialData.prioridad);
        setFechaProgramada(
          initialData.fechaProgramada
            ? new Date(initialData.fechaProgramada).toISOString().split('T')[0]
            : ''
        );
        setSucursalId(initialData.sucursalId);
        setTecnicoId(initialData.tecnicoId || '');
      } else {
        setCodigoCliente('');
        setDescripcion('');
        setTrabajo('');
        setObservaciones('');
        setRubro('CIVIL');
        setPrioridad('PROGRAMADO');
        setFechaProgramada('');
        setSucursalId('');
        setTecnicoId('');
      }
      setError(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalId) {
      setError('Debe seleccionar una sucursal');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        codigoCliente: codigoCliente.trim() || null,
        descripcion: descripcion.trim(),
        trabajo: trabajo.trim() || null,
        observaciones: observaciones.trim() || null,
        rubro,
        prioridad,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada).toISOString() : null,
        sucursalId: Number(sucursalId),
        tecnicoId: tecnicoId ? Number(tecnicoId) : null,
      });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Error al guardar el ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 z-10 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-t-xl">
            <h2 className="text-xl font-bold">{initialData ? 'Editar Ticket' : 'Nuevo Ticket'}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            {/* Datos del Ticket */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Datos del Ticket
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Código Cliente
                  </label>
                  <input
                    type="text"
                    value={codigoCliente}
                    onChange={(e) => setCodigoCliente(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="1124-65005"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Sucursal *
                  </label>
                  <select
                    required
                    disabled={isFetching}
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.cliente ? `(${s.cliente.razonSocial})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                  Descripción del Problema *
                </label>
                <textarea
                  required
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none"
                  placeholder="Descripción detallada del problema..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Trabajo a Realizar
                </label>
                <textarea
                  rows={2}
                  value={trabajo}
                  onChange={(e) => setTrabajo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none"
                  placeholder="Trabajo propuesto..."
                />
              </div>
            </div>

            {/* Clasificación */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Clasificación
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Rubro *
                  </label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value as RubroTicket)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    {Object.entries(RUBRO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Prioridad *
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as PrioridadTicket)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    {Object.entries(PRIORIDAD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Fecha Programada
                  </label>
                  <input
                    type="date"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Asignación */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Asignación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Técnico Asignado
                  </label>
                  <select
                    disabled={isFetching}
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    <option value="">Sin asignar</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} {t.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 text-slate-900 dark:text-white sticky bottom-0 z-10 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  GUARDAR TICKET
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
