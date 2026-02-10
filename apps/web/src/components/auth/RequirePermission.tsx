import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface RequirePermissionProps {
  permission: string | string[];
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  if (isSuperAdmin()) return <>{children}</>;

  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
