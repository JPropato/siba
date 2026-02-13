import { Users, UserPlus, ShieldCheck, Plus, UserCheck, FileText, BarChart3 } from 'lucide-react';
import type { ModuleTilesConfig } from '../../types/tiles';

export const rrhhTiles: ModuleTilesConfig = {
  moduleId: 'rrhh',
  moduleName: 'Recursos Humanos',
  icon: Users,
  breadcrumb: ['RRHH', 'Inicio'],
  subtitle: 'Gestión de personal y seguros',
  categories: [
    {
      id: 'acciones',
      title: 'Acciones',
      tiles: [
        {
          id: 'nuevo-empleado',
          icon: UserPlus,
          title: 'Nuevo Empleado',
          description: 'Dar de alta un empleado',
          path: '/dashboard/empleados?action=create',
          permission: 'empleados:escribir',
          type: 'action',
        },
        {
          id: 'registrar-seguro',
          icon: Plus,
          title: 'Registrar Seguro AP',
          description: 'Cargar póliza de seguro',
          path: '/dashboard/seguros-ap?action=create',
          permission: 'empleados:escribir',
          type: 'action',
        },
      ],
    },
    {
      id: 'consultas',
      title: 'Consultas',
      tiles: [
        {
          id: 'empleados',
          icon: Users,
          title: 'Empleados',
          description: 'Listado de personal',
          path: '/dashboard/empleados',
          permission: 'empleados:leer',
          type: 'query',
        },
        {
          id: 'empleados-activos',
          icon: UserCheck,
          title: 'Empleados Activos',
          description: 'Personal en actividad',
          path: '/dashboard/empleados?estado=ACTIVO',
          permission: 'empleados:leer',
          type: 'query',
        },
        {
          id: 'seguros-ap',
          icon: ShieldCheck,
          title: 'Seguros AP',
          description: 'Gestionar pólizas',
          path: '/dashboard/seguros-ap',
          permission: 'empleados:leer',
          type: 'query',
        },
      ],
    },
    {
      id: 'reportes',
      title: 'Reportes',
      tiles: [
        {
          id: 'nomina',
          icon: FileText,
          title: 'Nómina',
          description: 'Listado de empleados',
          path: '/dashboard/empleados?formato=reporte',
          permission: 'empleados:leer',
          type: 'report',
        },
        {
          id: 'estadisticas',
          icon: BarChart3,
          title: 'Estadísticas',
          description: 'Métricas de personal',
          path: '/dashboard/empleados?tab=estadisticas',
          permission: 'empleados:leer',
          type: 'report',
        },
      ],
    },
  ],
};
