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
  BookOpen,
  Store,
  FileText,
  Banknote,
  CreditCard,
  Receipt,
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
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      { id: 'tickets', label: 'Tickets', icon: ClipboardList, permission: 'tickets:leer' },
      { id: 'obras', label: 'Obras', icon: HardHat, permission: 'obras:leer' },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    items: [
      { id: 'proveedores', label: 'Proveedores', icon: Store, permission: 'compras:leer' },
      {
        id: 'facturas-proveedor',
        label: 'Facturas',
        icon: FileText,
        permission: 'compras:leer',
      },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    items: [
      { id: 'clientes', label: 'Clientes', icon: Building2, permission: 'clientes:leer' },
      {
        id: 'facturas-emitidas',
        label: 'Facturas',
        icon: FileText,
        permission: 'facturacion:leer',
      },
    ],
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    items: [
      {
        id: 'finanzas-dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-cuentas',
        label: 'Cuentas / Bancos',
        icon: Landmark,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-movimientos',
        label: 'Movimientos',
        icon: ArrowLeftRight,
        permission: 'finanzas:leer',
      },
      { id: 'cheques', label: 'Cheques', icon: Banknote, permission: 'compras:leer' },
      { id: 'tarjetas', label: 'Tarjetas', icon: Wallet, permission: 'tarjetas:leer' },
      { id: 'rendiciones', label: 'Mis Gastos', icon: Receipt, permission: 'tarjetas:leer' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    items: [
      {
        id: 'contabilidad-dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-plan-cuentas',
        label: 'Plan de Cuentas',
        icon: BookOpen,
        permission: 'finanzas:leer',
      },
      {
        id: 'finanzas-centros-costo',
        label: 'Centros de Costo',
        icon: CreditCard,
        permission: 'finanzas:leer',
      },
    ],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    items: [
      { id: 'empleados', label: 'Empleados', icon: Users, permission: 'empleados:leer' },
      { id: 'seguros-ap', label: 'Seguros AP', icon: ShieldCheck, permission: 'empleados:leer' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    items: [
      { id: 'sedes', label: 'Sedes', icon: MapPin, permission: 'sedes:leer' },
      { id: 'vehiculos', label: 'Vehiculos', icon: Truck, permission: 'vehiculos:leer' },
      { id: 'zonas', label: 'Zonas', icon: Map, permission: 'zonas:leer' },
      { id: 'materiales', label: 'Materiales', icon: Package, permission: 'materiales:leer' },
    ],
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
  operaciones: ['tickets:leer', 'obras:leer'],
  compras: 'compras:leer',
  ventas: ['clientes:leer', 'facturacion:leer'],
  tesoreria: ['finanzas:leer', 'compras:leer', 'tarjetas:leer'],
  contabilidad: 'finanzas:leer',
  rrhh: 'empleados:leer',
  administracion: ['sedes:leer', 'vehiculos:leer', 'zonas:leer', 'materiales:leer'],
  seguridad: ['usuarios:leer', 'roles:leer', 'audit:leer'],
  configuracion: null,
};

export const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: 'trending_up',
    subItems: [
      { id: 'tickets', label: 'Tickets', permission: 'tickets:leer' },
      { id: 'obras', label: 'Obras', permission: 'obras:leer' },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    icon: 'trending_up',
    subItems: [
      { id: 'proveedores', label: 'Proveedores', permission: 'compras:leer' },
      { id: 'facturas-proveedor', label: 'Facturas', permission: 'compras:leer' },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: 'trending_up',
    subItems: [
      { id: 'clientes', label: 'Clientes', permission: 'clientes:leer' },
      { id: 'facturas-emitidas', label: 'Facturas', permission: 'facturacion:leer' },
    ],
  },
  {
    id: 'tesoreria',
    label: 'Tesorería',
    icon: 'account_balance_wallet',
    subItems: [
      { id: 'finanzas-dashboard', label: 'Dashboard', permission: 'finanzas:leer' },
      { id: 'finanzas-cuentas', label: 'Cuentas/Bancos', permission: 'finanzas:leer' },
      { id: 'finanzas-movimientos', label: 'Movimientos', permission: 'finanzas:leer' },
      { id: 'cheques', label: 'Cheques', permission: 'compras:leer' },
      { id: 'tarjetas', label: 'Tarjetas', permission: 'tarjetas:leer' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: 'account_balance_wallet',
    subItems: [
      { id: 'contabilidad-dashboard', label: 'Dashboard', permission: 'finanzas:leer' },
      { id: 'finanzas-plan-cuentas', label: 'Plan de Cuentas', permission: 'finanzas:leer' },
      { id: 'finanzas-centros-costo', label: 'Centros de Costo', permission: 'finanzas:leer' },
    ],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: 'groups',
    subItems: [
      { id: 'empleados', label: 'Empleados', permission: 'empleados:leer' },
      { id: 'seguros-ap', label: 'Seguros AP', permission: 'empleados:leer' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: 'corporate_fare',
    subItems: [
      { id: 'sedes', label: 'Sedes', permission: 'sedes:leer' },
      { id: 'vehiculos', label: 'Vehiculos', permission: 'vehiculos:leer' },
      { id: 'zonas', label: 'Zonas', permission: 'zonas:leer' },
      { id: 'materiales', label: 'Materiales', permission: 'materiales:leer' },
    ],
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
