import { useState, useEffect } from 'react';
import type { Role, PermissionsGrouped } from '../../types/role';

interface RoleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { nombre: string; descripcion: string; permisoIds: number[] }) => Promise<void>;
    role: Role | null;
    permissionsGrouped: PermissionsGrouped;
}

export default function RoleDialog({ isOpen, onClose, onSave, role, permissionsGrouped }: RoleDialogProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (role) {
            setNombre(role.nombre);
            setDescripcion(role.descripcion || '');
            setSelectedPermissions(role.permisos.map(p => p.id));
        } else {
            setNombre('');
            setDescripcion('');
            setSelectedPermissions([]);
        }
        setError('');
    }, [role, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSave({
                nombre,
                descripcion,
                permisoIds: selectedPermissions
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (id: number) => {
        setSelectedPermissions(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const toggleModuleAll = (modulo: string) => {
        const modulePerms = permissionsGrouped.grouped[modulo] || [];
        const moduleIds = modulePerms.map(p => p.id);
        const allSelected = moduleIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !moduleIds.includes(id)));
        } else {
            setSelectedPermissions(prev => [...new Set([...prev, ...moduleIds])]);
        }
    };

    if (!isOpen) return null;

    const isEditingSuperAdmin = role?.nombre === 'Super Admin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                        {role ? 'Editar Rol' : 'Nuevo Rol'}
                    </h2>
                    <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Nombre del Rol *
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                placeholder="Ej: Vendedor, Gerente..."
                                required
                                disabled={isEditingSuperAdmin}
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-brand focus:border-brand outline-none resize-none"
                                rows={2}
                                placeholder="Descripción opcional del rol..."
                            />
                        </div>

                        {/* Permisos */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                                Permisos
                            </label>

                            {isEditingSuperAdmin && (
                                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                    <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
                                    El rol Super Admin siempre tiene todos los permisos.
                                </div>
                            )}

                            <div className="space-y-4">
                                {Object.entries(permissionsGrouped.grouped).map(([modulo, perms]) => {
                                    const moduleIds = perms.map(p => p.id);
                                    const allSelected = moduleIds.every(id => selectedPermissions.includes(id));
                                    const someSelected = moduleIds.some(id => selectedPermissions.includes(id));

                                    return (
                                        <div key={modulo} className="border border-[var(--border)] rounded-lg overflow-hidden">
                                            {/* Module Header */}
                                            <div
                                                className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
                                                onClick={() => !isEditingSuperAdmin && toggleModuleAll(modulo)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={el => {
                                                        if (el) el.indeterminate = someSelected && !allSelected;
                                                    }}
                                                    onChange={() => { }}
                                                    disabled={isEditingSuperAdmin}
                                                    className="size-4 rounded border-slate-300 text-brand focus:ring-brand"
                                                />
                                                <span className="font-medium text-[var(--foreground)]">{modulo}</span>
                                                <span className="text-xs text-[var(--muted)]">({perms.length} permisos)</span>
                                            </div>

                                            {/* Permissions */}
                                            <div className="px-4 py-3 space-y-2">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-start gap-3 cursor-pointer group"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissions.includes(perm.id) || isEditingSuperAdmin}
                                                            onChange={() => togglePermission(perm.id)}
                                                            disabled={isEditingSuperAdmin}
                                                            className="size-4 mt-0.5 rounded border-slate-300 text-brand focus:ring-brand"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--foreground)] group-hover:text-brand">
                                                                {perm.codigo}
                                                            </p>
                                                            {perm.descripcion && (
                                                                <p className="text-xs text-[var(--muted)]">{perm.descripcion}</p>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-slate-50 dark:bg-slate-800/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--foreground)] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                        {loading && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
                        {role ? 'Guardar Cambios' : 'Crear Rol'}
                    </button>
                </div>
            </div>
        </div>
    );
}
