import { Shield, UserPlus, Plus, Users, ShieldCheck, FileText, Eye, BarChart3 } from 'lucide-react';
import type { ModuleTilesConfig } from '../../types/tiles';

export const seguridadTiles: ModuleTilesConfig = {
  moduleId: 'seguridad',
  moduleName: 'Seguridad',
  icon: Shield,
  breadcrumb: ['Seguridad', 'Inicio'],
  subtitle: 'Gestión de usuarios, roles y auditoría',
  categories: [
    {
      id: 'acciones',
      title: 'Acciones',
      tiles: [
        {
          id: 'nuevo-usuario',
          icon: UserPlus,
          title: 'Nuevo Usuario',
          description: 'Crear usuario del sistema',
          path: '/dashboard/users?action=create',
          permission: 'usuarios:leer',
          type: 'action',
        },
        {
          id: 'nuevo-rol',
          icon: Plus,
          title: 'Nuevo Rol',
          description: 'Crear rol con permisos',
          path: '/dashboard/roles?action=create',
          permission: 'roles:leer',
          type: 'action',
        },
      ],
    },
    {
      id: 'consultas',
      title: 'Consultas',
      tiles: [
        {
          id: 'usuarios',
          icon: Users,
          title: 'Usuarios',
          description: 'Gestionar usuarios',
          path: '/dashboard/users',
          permission: 'usuarios:leer',
          type: 'query',
        },
        {
          id: 'roles',
          icon: ShieldCheck,
          title: 'Roles y Permisos',
          description: 'Configurar roles',
          path: '/dashboard/roles',
          permission: 'roles:leer',
          type: 'query',
        },
        {
          id: 'auditoria',
          icon: Eye,
          title: 'Auditoría',
          description: 'Registro de actividad',
          path: '/dashboard/audit',
          permission: 'audit:leer',
          type: 'query',
        },
      ],
    },
    {
      id: 'reportes',
      title: 'Reportes',
      tiles: [
        {
          id: 'actividad-reciente',
          icon: FileText,
          title: 'Actividad Reciente',
          description: 'Últimas acciones del sistema',
          path: '/dashboard/audit?periodo=ultimos7dias',
          permission: 'audit:leer',
          type: 'report',
        },
        {
          id: 'estadisticas-usuarios',
          icon: BarChart3,
          title: 'Estadísticas',
          description: 'Métricas de usuarios',
          path: '/dashboard/users?tab=estadisticas',
          permission: 'usuarios:leer',
          type: 'report',
        },
      ],
    },
  ],
};
