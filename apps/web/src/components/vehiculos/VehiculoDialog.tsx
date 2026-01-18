import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import type { Vehiculo, VehiculoFormData } from '../../types/vehiculos';
import type { Zona } from '../../types/zona';

interface VehiculoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: VehiculoFormData) => Promise<void>;
    initialData?: Vehiculo | null;
}

export default function VehiculoDialog({ isOpen, onClose, onSave, initialData }: VehiculoDialogProps) {
    const [patente, setPatente] = useState('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [anio, setAnio] = useState<number | ''>('');
    const [tipo, setTipo] = useState('');
    const [zonaId, setZonaId] = useState<number | ''>('');

    // Nuevos campos
    const [proximosKm, setProximosKm] = useState<number | ''>('');
    const [proximoService, setProximoService] = useState('');
    const [estado, setEstado] = useState<'ACTIVO' | 'TALLER' | 'FUERA_SERVICIO'>('ACTIVO');

    const [zonas, setZonas] = useState<Zona[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingZonas, setIsFetchingZonas] = useState(false);
    const [error, setError] = useState<string | string[] | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Cargar zonas
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
                setPatente(initialData.patente);
                setMarca(initialData.marca || '');
                setModelo(initialData.modelo || '');
                setAnio(initialData.anio || '');
                setTipo(initialData.tipo || '');
                setZonaId(initialData.zonaId || '');
                setProximosKm(initialData.proximosKm || '');
                setProximoService(initialData.proximoService ? new Date(initialData.proximoService).toISOString().split('T')[0] : '');
                setEstado(initialData.estado || 'ACTIVO');
            } else {
                setPatente('');
                setMarca('');
                setModelo('');
                setAnio('');
                setTipo('');
                setZonaId('');
                setProximosKm('');
                setProximoService('');
                setEstado('ACTIVO');
            }
            setError(null);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset fields
            setPatente('');
            setMarca('');
            setModelo('');
            setAnio('');
            setTipo('');
            setZonaId('');
            setProximosKm('');
            setProximoService('');
            setEstado('ACTIVO');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialData]);

    const formatError = (err: any) => {
        if (Array.isArray(err)) {
            return err.map((e: any) => e.message || e).join('. ');
        }
        return err?.toString() || 'Error desconocido';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSave({
                patente: patente.trim().toUpperCase(),
                marca: marca.trim() || undefined,
                modelo: modelo.trim() || undefined,
                anio: anio ? Number(anio) : undefined,
                tipo: tipo.trim() || undefined,
                zonaId: zonaId ? Number(zonaId) : undefined,
                proximosKm: proximosKm ? Number(proximosKm) : undefined,
                proximoService: proximoService ? new Date(proximoService).toISOString() : undefined,
                estado: estado
            });
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            setError(backendError || 'Error al guardar el vehículo.');
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
                            {initialData ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {formatError(error)}
                            </div>
                        )}

                        {/* Datos Principales */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Datos de Identificación</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">Patente *</label>
                                    <input
                                        type="text"
                                        required
                                        value={patente}
                                        onChange={(e) => setPatente(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-mono font-bold uppercase tracking-widest"
                                        placeholder="AAA123"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</label>
                                    <select
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value as any)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                                    >
                                        <option value="ACTIVO">✅ Activo</option>
                                        <option value="TALLER">🔧 En Taller</option>
                                        <option value="FUERA_SERVICIO">⛔ Fuera de Servicio</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marca</label>
                                    <input
                                        type="text"
                                        value={marca}
                                        onChange={(e) => setMarca(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                        placeholder="Ej: Toyota"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                                    <input
                                        type="text"
                                        value={modelo}
                                        onChange={(e) => setModelo(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                        placeholder="Ej: Hilux"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Año</label>
                                    <input
                                        type="number"
                                        value={anio}
                                        onChange={(e) => setAnio(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Datos Operativos */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Logística y Mantenimiento</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zona (Opcional)</label>
                                    <select
                                        disabled={isFetchingZonas}
                                        value={zonaId}
                                        onChange={(e) => setZonaId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold"
                                    >
                                        <option value="">Sin Asignar</option>
                                        {zonas.map(z => (
                                            <option key={z.id} value={z.id}>{z.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
                                    <select
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    >
                                        <option value="">Seleccione tipo...</option>
                                        <option value="Camión">Camión</option>
                                        <option value="Camioneta">Camioneta</option>
                                        <option value="Furgón">Furgón</option>
                                        <option value="Auto">Auto</option>
                                        <option value="Utilitario">Utilitario</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Próximo Service (Fecha)</label>
                                    <input
                                        type="date"
                                        value={proximoService}
                                        onChange={(e) => setProximoService(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kms Próx. Revisión</label>
                                    <input
                                        type="number"
                                        value={proximosKm}
                                        onChange={(e) => setProximosKm(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                        placeholder="Ej: 50000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 text-slate-900 dark:text-white sticky bottom-0 z-10 backdrop-blur-sm">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    GUARDAR VEHÍCULO
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
