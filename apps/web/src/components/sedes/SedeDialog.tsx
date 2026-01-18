import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import type { Sede, SedeFormData } from '../../types/sedes';
import type { Cliente } from '../../types/client';
import type { Zona } from '../../types/zona';

interface SedeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SedeFormData) => Promise<void>;
    initialData?: Sede | null;
}

export default function SedeDialog({ isOpen, onClose, onSave, initialData }: SedeDialogProps) {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [clienteId, setClienteId] = useState<number | ''>('');
    const [zonaId, setZonaId] = useState<number | ''>('');
    const [telefono, setTelefono] = useState('');
    const [contactoNombre, setContactoNombre] = useState('');
    const [contactoTelefono, setContactoTelefono] = useState('');
    const [codigoExterno, setCodigoExterno] = useState('');

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [zonas, setZonas] = useState<Zona[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDeps, setIsFetchingDeps] = useState(false);
    const [error, setError] = useState<string | string[] | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Cargar dependencias
            const fetchDeps = async () => {
                setIsFetchingDeps(true);
                try {
                    const [resClients, resZones] = await Promise.all([
                        api.get('/clients?limit=100'),
                        api.get('/zones?limit=100')
                    ]);
                    setClientes(resClients.data.data || []);
                    setZonas(resZones.data.data || []);
                } catch (err) {
                    console.error('Error fetching dependencies:', err);
                    setError('No se pudieron cargar los clientes o zonas.');
                } finally {
                    setIsFetchingDeps(false);
                }
            };
            fetchDeps();

            if (initialData) {
                setNombre(initialData.nombre);
                setDireccion(initialData.direccion);
                setClienteId(initialData.clienteId);
                setZonaId(initialData.zonaId);
                setTelefono(initialData.telefono || '');
                setContactoNombre(initialData.contactoNombre || '');
                setContactoTelefono(initialData.contactoTelefono || '');
                setCodigoExterno(initialData.codigoExterno || '');
            } else {
                setNombre('');
                setDireccion('');
                setClienteId('');
                setZonaId('');
                setTelefono('');
                setContactoNombre('');
                setContactoTelefono('');
                setCodigoExterno('');
            }
            setError(null);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
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
        if (!clienteId || !zonaId) {
            setError('Debe seleccionar un cliente y una zona.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onSave({
                clienteId: Number(clienteId),
                zonaId: Number(zonaId),
                nombre: nombre.trim(),
                direccion: direccion.trim(),
                telefono: telefono.trim() || undefined,
                contactoNombre: contactoNombre.trim() || undefined,
                contactoTelefono: contactoTelefono.trim() || undefined,
                codigoExterno: codigoExterno.trim() || undefined,
            });
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            setError(backendError || 'Error al guardar la sede.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                        <h2 className="text-xl font-bold">
                            {initialData ? 'Editar Sede' : 'Nueva Sede'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {formatError(error)}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente Propietario *</label>
                                <select
                                    required
                                    disabled={isFetchingDeps}
                                    value={clienteId}
                                    onChange={(e) => setClienteId(Number(e.target.value))}
                                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
                                >
                                    <option value="">Seleccione un cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.razonSocial}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zona Geográfica *</label>
                                <select
                                    required
                                    disabled={isFetchingDeps}
                                    value={zonaId}
                                    onChange={(e) => setZonaId(Number(e.target.value))}
                                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
                                >
                                    <option value="">Seleccione una zona...</option>
                                    {zonas.map(z => (
                                        <option key={z.id} value={z.id}>{z.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1 text-slate-900 dark:text-white">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre de la Sede *</label>
                                    <input
                                        type="text"
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                        placeholder="Ej: Depósito Norte"
                                    />
                                </div>
                                <div className="space-y-1 text-slate-900 dark:text-white">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">Código Externo</label>
                                    <input
                                        type="text"
                                        value={codigoExterno}
                                        onChange={(e) => setCodigoExterno(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/30 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-bold"
                                        placeholder="Identif. Cliente"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 text-slate-900 dark:text-white">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dirección Completa *</label>
                                    <input
                                        type="text"
                                        required
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                                <div className="space-y-1 text-slate-900 dark:text-white">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teléfono Directo</label>
                                    <input
                                        type="text"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
                            <h3 className="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">person</span>
                                Información de Contacto
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Nombre Responsable</label>
                                    <input
                                        type="text"
                                        value={contactoNombre}
                                        onChange={(e) => setContactoNombre(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">Teléfono Responsable</label>
                                    <input
                                        type="text"
                                        value={contactoTelefono}
                                        onChange={(e) => setContactoTelefono(e.target.value)}
                                        className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isFetchingDeps}
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
                                    GUARDAR SEDE
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
