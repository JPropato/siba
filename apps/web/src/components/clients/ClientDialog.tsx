import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Cliente, ClienteFormData } from '../../types/client';

interface ClientDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ClienteFormData) => Promise<void>;
    initialData?: Cliente | null;
}

export default function ClientDialog({ isOpen, onClose, onSave, initialData }: ClientDialogProps) {
    const [razonSocial, setRazonSocial] = useState('');
    const [cuit, setCuit] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccionFiscal, setDireccionFiscal] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setRazonSocial(initialData.razonSocial);
                setCuit(initialData.cuit || '');
                setEmail(initialData.email || '');
                setTelefono(initialData.telefono || '');
                setDireccionFiscal(initialData.direccionFiscal || '');
            } else {
                setRazonSocial('');
                setCuit('');
                setEmail('');
                setTelefono('');
                setDireccionFiscal('');
            }
            setError(null);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialData]);

    const formatCuit = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) return digits;
        if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
    };

    const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCuit(formatCuit(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSave({
                razonSocial,
                cuit: cuit.replace(/\D/g, '') || undefined,
                email: email.trim() || undefined,
                telefono: telefono.trim() || undefined,
                direccionFiscal: direccionFiscal.trim() || undefined,
            });
            onClose();
        } catch (err: any) {
            console.error('Save error:', err);
            const backendError = err.response?.data?.error;
            if (Array.isArray(backendError)) {
                setError(backendError.map((e: any) => e.message).join('. '));
            } else {
                setError(backendError || 'Error al guardar el cliente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    {/* Header - Aligned with UserDialog */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body - Aligned with UserDialog styling */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razón Social *</label>
                            <input
                                type="text"
                                required
                                value={razonSocial}
                                onChange={(e) => setRazonSocial(e.target.value)}
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                                placeholder="Ej: Bauman S.A."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CUIT / ID Fiscal</label>
                                <input
                                    type="text"
                                    value={cuit}
                                    onChange={handleCuitChange}
                                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                                    placeholder="00-00000000-0"
                                    maxLength={13}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                                <input
                                    type="text"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                                    placeholder="Ej: +54 9..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Fiscal</label>
                            <textarea
                                value={direccionFiscal}
                                onChange={(e) => setDireccionFiscal(e.target.value)}
                                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all resize-none text-slate-900 dark:text-white"
                                placeholder="Calle, Número, Localidad..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Footer - Aligned with UserDialog */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
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
                            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Guardar
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
