import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Building2,
  Package,
  Users,
  ShieldCheck,
  Shield,
  Settings,
  ChevronDown,
  X,
  ClipboardList,
  HardHat,
  BarChart3,
  ArrowLeftRight,
  Landmark,
  MapPin,
  Truck,
  Map,
} from 'lucide-react';

// ── New flat structure ──────────────────────────────────────

export interface FlatNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: FlatNavItem[];
}

export const standaloneItems: FlatNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:leer' },
];

export const navSections: NavSection[] = [
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { id: 'tickets', label: 'Tickets', icon: ClipboardList, permission: 'tickets:leer' },
      { id: 'obras', label: 'Obras', icon: HardHat, permission: 'obras:leer' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    items: [
      {
        id: 'finanzas-dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-movimientos',
        label: 'Movimientos',
        icon: ArrowLeftRight,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-cuentas',
        label: 'Cuentas / Bancos',
        icon: Landmark,
        permission: 'finanzas:leer',
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administracion',
    items: [
      { id: 'clientes', label: 'Clientes', icon: Building2, permission: 'clientes:leer' },
      { id: 'sedes', label: 'Sedes', icon: MapPin, permission: 'sedes:leer' },
      { id: 'vehiculos', label: 'Vehiculos', icon: Truck, permission: 'vehiculos:leer' },
      { id: 'zonas', label: 'Zonas', icon: Map, permission: 'zonas:leer' },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catalogo',
    items: [
      { id: 'materiales', label: 'Materiales', icon: Package, permission: 'materiales:leer' },
    ],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    items: [{ id: 'empleados', label: 'Empleados', icon: Users, permission: 'empleados:leer' }],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: ShieldCheck, permission: 'usuarios:leer' },
      { id: 'roles', label: 'Roles', icon: ShieldCheck, permission: 'roles:leer' },
      { id: 'audit', label: 'Auditoría', icon: Shield, permission: 'audit:leer' },
    ],
  },
];

export const sidebarBottomItems: FlatNavItem[] = [
  { id: 'configuracion', label: 'Configuracion', icon: Settings },
];

// ── Legacy exports (BottomNav + TopNav compatibility) ───────

export interface SubItem {
  id: string;
  label: string;
  permission?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SubItem[];
}

export const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  trending_up: TrendingUp,
  account_balance_wallet: Wallet,
  corporate_fare: Building2,
  inventory_2: Package,
  groups: Users,
  admin_panel_settings: ShieldCheck,
  settings: Settings,
  expand_more: ChevronDown,
  close: X,
};

export const menuPermissions: Record<string, string | string[] | null> = {
  dashboard: 'dashboard:leer',
  comercial: ['tickets:leer', 'obras:leer'],
  finanzas: 'finanzas:leer',
  administracion: ['clientes:leer', 'vehiculos:leer', 'zonas:leer', 'sedes:leer'],
  catalogo: 'materiales:leer',
  rrhh: 'empleados:leer',
  seguridad: ['usuarios:leer', 'roles:leer', 'audit:leer'],
  configuracion: null,
};

export const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: 'trending_up',
    subItems: [
      { id: 'tickets', label: 'Tickets', permission: 'tickets:leer' },
      { id: 'obras', label: 'Obras', permission: 'obras:leer' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: 'account_balance_wallet',
    subItems: [
      { id: 'finanzas-dashboard', label: 'Dashboard', permission: 'finanzas:leer' },
      { id: 'finanzas-movimientos', label: 'Movimientos', permission: 'finanzas:leer' },
      { id: 'finanzas-cuentas', label: 'Cuentas/Bancos', permission: 'finanzas:leer' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administracion',
    icon: 'corporate_fare',
    subItems: [
      { id: 'clientes', label: 'Clientes', permission: 'clientes:leer' },
      { id: 'sedes', label: 'Sedes', permission: 'sedes:leer' },
      { id: 'vehiculos', label: 'Vehiculos', permission: 'vehiculos:leer' },
      { id: 'zonas', label: 'Zonas', permission: 'zonas:leer' },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catalogo',
    icon: 'inventory_2',
    subItems: [{ id: 'materiales', label: 'Materiales', permission: 'materiales:leer' }],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: 'groups',
    subItems: [{ id: 'empleados', label: 'Empleados', permission: 'empleados:leer' }],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: 'admin_panel_settings',
    subItems: [
      { id: 'usuarios', label: 'Usuarios', permission: 'usuarios:leer' },
      { id: 'roles', label: 'Roles', permission: 'roles:leer' },
      { id: 'audit', label: 'Auditoría', permission: 'audit:leer' },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { id: 'configuracion', label: 'Configuracion', icon: 'settings' },
];
