import { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import api from '../../lib/api';

interface Role {
    id: number;
    nombre: string;
    descripcion: string | null;
}

interface UserFormData {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    rolId: number;
}

interface UserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UserFormData) => Promise<void>;
    initialData?: User | null;
}

export default function UserDialog({ isOpen, onClose, onSave, initialData }: UserDialogProps) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rolId, setRolId] = useState<number | ''>('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch roles from API
    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const { data } = await api.get('/roles');
                setRoles(data);
            } catch (err) {
                console.error('Error fetching roles:', err);
            } finally {
                setLoadingRoles(false);
            }
        };

        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    // Reset form when opening/changing data
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNombre(initialData.nombre);
                setApellido(initialData.apellido);
                setEmail(initialData.email);
                // Find the role ID from the user's roles (roles is string array of role names)
                const userRoleName = initialData.roles?.[0];
                if (userRoleName && roles.length > 0) {
                    const matchedRole = roles.find(r => r.nombre === userRoleName);
                    setRolId(matchedRole?.id || '');
                } else {
                    setRolId('');
                }
                setPassword(''); // Don't show password
            } else {
                setNombre('');
                setApellido('');
                setEmail('');
                setRolId('');
                setPassword('');
            }
            setError(null);
        }
    }, [isOpen, initialData, roles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rolId) {
            setError('Debes seleccionar un rol');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onSave({
                nombre,
                apellido,
                email,
                password: password || undefined, // Send undefined if empty (no update)
                rolId: Number(rolId),
            });
            onClose();
        } catch (err: unknown) {
            console.error(err);
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Error al guardar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apellido</label>
                                <input
                                    type="text"
                                    required
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {initialData ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                            </label>
                            <input
                                type="password"
                                required={!initialData} // Required only on create
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</label>
                            <select
                                value={rolId}
                                onChange={(e) => setRolId(e.target.value ? Number(e.target.value) : '')}
                                required
                                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                            >
                                <option value="">
                                    {loadingRoles ? 'Cargando roles...' : 'Seleccionar rol'}
                                </option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

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
                            disabled={isLoading || loadingRoles}
                            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
