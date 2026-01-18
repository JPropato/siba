import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import type {
  Empleado,
  EmpleadoFormData,
  TipoEmpleado,
  TipoContratacion,
} from '../../types/empleados';
import type { Zona } from '../../types/zona';

interface EmpleadoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpleadoFormData) => Promise<void>;
  initialData?: Empleado | null;
}

export default function EmpleadoDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EmpleadoDialogProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [inicioRelacionLaboral, setInicioRelacionLaboral] = useState('');
  const [tipo, setTipo] = useState<TipoEmpleado>('TECNICO');
  const [contratacion, setContratacion] = useState<TipoContratacion | ''>('');
  const [zonaId, setZonaId] = useState<number | ''>('');

  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingZonas, setIsFetchingZonas] = useState(false);
  const [error, setError] = useState<string | string[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchZonas = async () => {
        setIsFetchingZonas(true);
        try {
          const res = await api.get('/zones?limit=100');
          setZonas(res.data.data || []);
        } catch (err) {
          console.error('Error fetching zones:', err);
        } finally {
          setIsFetchingZonas(false);
        }
      };
      fetchZonas();

      if (initialData) {
        setNombre(initialData.nombre);
        setApellido(initialData.apellido);
        setEmail(initialData.email || '');
        setDireccion(initialData.direccion || '');
        setTelefono(initialData.telefono || '');
        setInicioRelacionLaboral(
          new Date(initialData.inicioRelacionLaboral).toISOString().split('T')[0]
        );
        setTipo(initialData.tipo);
        setContratacion(initialData.contratacion || '');
        setZonaId(initialData.zonaId || '');
      } else {
        setNombre('');
        setApellido('');
        setEmail('');
        setDireccion('');
        setTelefono('');
        setInicioRelacionLaboral('');
        setTipo('TECNICO');
        setContratacion('');
        setZonaId('');
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

  const formatError = (err: unknown) => {
    if (Array.isArray(err)) {
      return err.map((e: { message?: string }) => e.message || String(e)).join('. ');
    }
    return String(err) || 'Error desconocido';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        inicioRelacionLaboral: new Date(inicioRelacionLaboral).toISOString(),
        tipo,
        contratacion: contratacion || null,
        zonaId: zonaId ? Number(zonaId) : null,
      });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const backendError = axiosErr.response?.data?.error;
      setError(backendError || 'Error al guardar el empleado.');
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
            <h2 className="text-xl font-bold">
              {initialData ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h2>
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
                {formatError(error)}
              </div>
            )}

            {/* Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Datos Personales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="jperez@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Dirección
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                  placeholder="Av. Siempre Viva 123"
                />
              </div>
            </div>

            {/* Datos Laborales */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Datos Laborales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Inicio Relación Laboral *
                  </label>
                  <input
                    type="date"
                    required
                    value={inicioRelacionLaboral}
                    onChange={(e) => setInicioRelacionLaboral(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Zona (Opcional)
                  </label>
                  <select
                    disabled={isFetchingZonas}
                    value={zonaId}
                    onChange={(e) => setZonaId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    <option value="">Sin Asignar</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">
                    Tipo *
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoEmpleado)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    <option value="TECNICO">👷 Técnico</option>
                    <option value="ADMINISTRATIVO">📋 Administrativo</option>
                    <option value="GERENTE">👔 Gerente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Contratación
                  </label>
                  <select
                    value={contratacion}
                    onChange={(e) => setContratacion(e.target.value as TipoContratacion | '')}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                  >
                    <option value="">Sin especificar</option>
                    <option value="CONTRATO_MARCO">Contrato Marco</option>
                  </select>
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
                  GUARDAR EMPLEADO
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
