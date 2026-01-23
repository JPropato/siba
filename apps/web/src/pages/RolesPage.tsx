import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Shield, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Role, PermissionsGrouped } from '../types/role';
import RoleDialog from '../components/roles/RoleDialog';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<PermissionsGrouped | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/roles');
            setRoles(data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const { data } = await api.get('/roles/permisos');
            setPermissions(data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const handleCreate = () => {
        setSelectedRole(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setIsDialogOpen(true);
    };

    const handleDelete = async (role: Role) => {
        if (role.nombre === 'Super Admin') {
            alert('No se puede eliminar el rol Super Admin');
            return;
        }
        if (!confirm(`¿Eliminar el rol "${role.nombre}"?`)) return;

        try {
            await api.delete(`/roles/${role.id}`);
            fetchRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            alert('Error al eliminar rol');
        }
    };

    const handleSave = async (data: { nombre: string; descripcion: string; permisoIds: number[] }) => {
        try {
            if (selectedRole) {
                await api.put(`/roles/${selectedRole.id}`, data);
            } else {
                await api.post('/roles', data);
            }
            setIsDialogOpen(false);
            fetchRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Gestión de Roles</h1>
                    <p className="text-sm text-[var(--muted)]">Administra roles y sus permisos asociados</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium shadow-lg shadow-brand/20"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Rol
                </button>
            </div>

            {/* Table */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[var(--muted)]">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand" />
                        <p className="mt-2 text-xs font-medium">Cargando roles...</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muted)]">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="mt-2 text-xs font-medium">No hay roles configurados</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--border)]">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Rol</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Permisos</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Usuarios</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-[var(--foreground)]">{role.nombre}</p>
                                            {role.descripcion && (
                                                <p className="text-sm text-[var(--muted)]">{role.descripcion}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permisos.slice(0, 3).map((p) => (
                                                <span
                                                    key={p.id}
                                                    className="px-2 py-0.5 text-xs bg-brand/10 text-brand rounded-full"
                                                >
                                                    {p.codigo}
                                                </span>
                                            ))}
                                            {role.permisos.length > 3 && (
                                                <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-[var(--muted)] rounded-full">
                                                    +{role.permisos.length - 3} más
                                                </span>
                                            )}
                                            {role.permisos.length === 0 && (
                                                <span className="text-sm text-[var(--muted)]">Sin permisos</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center size-8 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-medium">
                                            {role.usuariosCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(role)}
                                                className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-brand/10"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            {role.nombre !== 'Super Admin' && (
                                                <button
                                                    onClick={() => handleDelete(role)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Dialog */}
            {permissions && (
                <RoleDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                    role={selectedRole}
                    permissionsGrouped={permissions}
                />
            )}
        </div>
    );
}
