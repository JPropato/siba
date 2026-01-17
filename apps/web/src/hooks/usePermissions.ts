import { useAuthStore } from '../stores/auth-store';

/**
 * Hook para verificar permisos del usuario actual.
 * Super Admin siempre tiene acceso a todo.
 */
export function usePermissions() {
    const { user } = useAuthStore();

    /**
     * Verifica si el usuario tiene un permiso específico.
     * @param permCode - Código del permiso (ej: 'seguridad:leer')
     */
    const hasPermission = (permCode: string): boolean => {
        if (!user) return false;

        // Super Admin tiene acceso total
        if (user.roles?.includes('Super Admin')) return true;

        return user.permisos?.includes(permCode) ?? false;
    };

    /**
     * Verifica si el usuario tiene al menos uno de los permisos.
     * @param permCodes - Array de códigos de permisos
     */
    const hasAnyPermission = (permCodes: string[]): boolean => {
        return permCodes.some(p => hasPermission(p));
    };

    /**
     * Verifica si el usuario tiene todos los permisos.
     * @param permCodes - Array de códigos de permisos
     */
    const hasAllPermissions = (permCodes: string[]): boolean => {
        return permCodes.every(p => hasPermission(p));
    };

    /**
     * Verifica si el usuario tiene un rol específico.
     * @param roleName - Nombre del rol (ej: 'Super Admin')
     */
    const hasRole = (roleName: string): boolean => {
        if (!user) return false;
        return user.roles?.includes(roleName) ?? false;
    };

    /**
     * Verifica si el usuario es Super Admin.
     */
    const isSuperAdmin = (): boolean => {
        return hasRole('Super Admin');
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        isSuperAdmin,
        user,
    };
}
