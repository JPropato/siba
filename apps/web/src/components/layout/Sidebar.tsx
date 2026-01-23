import { useState, useMemo } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import logoBauman from '../../assets/logo-bauman.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentPage: string;
  onNavigate: (pageId: string, label: string, parentLabel?: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  subItems?: { id: string; label: string }[];
}

// Mapeo de permisos requeridos por cada menú
const menuPermissions: Record<string, string | null> = {
  dashboard: 'dashboard:leer',
  comercial: 'comercial:leer',
  finanzas: 'finanzas:leer',
  administracion: 'admin:leer',
  catalogo: 'admin:leer',
  rrhh: 'empleados:leer',
  seguridad: 'seguridad:leer',
  configuracion: null, // Siempre visible
};

const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: 'trending_up',
    subItems: [
      { id: 'tickets', label: 'Tickets' },
      { id: 'obras', label: 'Obras' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: 'account_balance_wallet',
    subItems: [
      { id: 'finanzas-dashboard', label: 'Dashboard' },
      { id: 'finanzas-movimientos', label: 'Movimientos' },
      { id: 'finanzas-cuentas', label: 'Cuentas/Bancos' },
      { id: 'finanzas-inversiones', label: 'Inversiones' },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: 'corporate_fare',
    subItems: [
      { id: 'clientes', label: 'Clientes' },
      { id: 'sedes', label: 'Sedes' },
      { id: 'vehiculos', label: 'Vehículos' },
      { id: 'zonas', label: 'Zonas' },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    icon: 'inventory_2',
    subItems: [{ id: 'materiales', label: 'Materiales' }],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: 'groups',
    subItems: [
      { id: 'empleados', label: 'Empleados' },
      { id: 'vacaciones', label: 'Vacaciones' },
      { id: 'sueldos', label: 'Sueldos' },
      { id: 'ausencias', label: 'Ausencias' },
    ],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: 'admin_panel_settings',
    subItems: [
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'roles', label: 'Roles' },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { id: 'configuracion', label: 'Configuración', icon: 'settings' },
];

export function Sidebar({
  isCollapsed,
  currentPage,
  onNavigate,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { hasPermission, isSuperAdmin } = usePermissions();

  // Filtrar menús según permisos del usuario
  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      const requiredPerm = menuPermissions[item.id];
      if (requiredPerm === null) return true; // Sin restricción
      if (isSuperAdmin()) return true; // Super Admin ve todo
      return hasPermission(requiredPerm);
    });
  }, [hasPermission, isSuperAdmin]);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: NavItem) => {
    if (item.subItems) {
      toggleMenu(item.id);
    } else {
      onNavigate(item.id, item.label);
      onMobileClose?.();
    }
  };

  const handleSubItemClick = (subItem: { id: string; label: string }, parentLabel: string) => {
    onNavigate(subItem.id, subItem.label, parentLabel);
    onMobileClose?.();
  };

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const isActive = currentPage === item.id;
    const isExpanded = expandedMenus.includes(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const showLabels = isMobile || !isCollapsed;

    return (
      <div key={item.id} className="relative group">
        <div
          onClick={() => handleItemClick(item)}
          className={`relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all
            ${isActive
              ? 'bg-brand/10 text-brand'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }
            ${hasSubItems && showLabels ? 'justify-between' : ''}
            ${!showLabels ? 'justify-center' : ''}
          `}
        >
          {isActive && <div className="sidebar-active-indicator" />}
          <div className={`flex items-center gap-3 ${!showLabels ? 'justify-center' : ''}`}>
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {showLabels && (
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            )}
          </div>
          {hasSubItems && showLabels && (
            <span
              className={`material-symbols-outlined text-xs transition-transform ${isExpanded ? 'rotate-180' : ''
                }`}
            >
              expand_more
            </span>
          )}
        </div>

        {/* Tooltip or Flyout for collapsed state */}
        {!showLabels && (
          <div className="absolute left-full top-0 ml-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 min-w-[180px] animate-in slide-in-from-left-2">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                {item.label}
              </span>
            </div>
            {hasSubItems ? (
              <div className="py-1">
                {item.subItems!.map((subItem) => (
                  <div
                    key={subItem.id}
                    onClick={() => handleSubItemClick(subItem, item.label)}
                    className={cn(
                      "px-4 py-2 text-sm transition-colors cursor-pointer",
                      currentPage === subItem.id
                        ? 'text-brand font-bold bg-brand/5'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    {subItem.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-1 text-sm text-slate-500 italic">
                Click para ir a {item.label}
              </div>
            )}
            <div className="absolute right-full top-4 border-8 border-transparent border-r-slate-200 dark:border-r-slate-800" />
            <div className="absolute right-full top-4 translate-x-[1px] border-8 border-transparent border-r-white dark:border-r-slate-900" />
          </div>
        )}

        {/* Submenus */}
        {hasSubItems && isExpanded && showLabels && (
          <div className="ml-4 mt-1 space-y-1 border-l border-[var(--border)] pl-4">
            {item.subItems!.map((subItem) => (
              <div
                key={subItem.id}
                onClick={() => handleSubItemClick(subItem, item.label)}
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition-all
                  ${currentPage === subItem.id
                    ? 'text-brand font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                {subItem.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (isMobile: boolean = false) => (
    <>
      {/* Logo Header */}
      <div
        className={`mb-2 flex items-center gap-3 transition-all duration-300
                ${isMobile ? 'p-4' : isCollapsed ? 'p-2 justify-center' : 'p-4'}
            `}
      >
        {isMobile || !isCollapsed ? (
          <>
            <img
              src={logoBauman}
              alt="Bauman"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
                SIBA
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-semibold tracking-[0.1em]">
                Sistema Bauman
              </p>
            </div>
          </>
        ) : (
          <div className="size-9 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200 dark:border-white/5">
            <span className="text-slate-700 dark:text-white font-bold text-xs">SB</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => renderNavItem(item, isMobile))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 mt-auto border-t border-[var(--border)] space-y-1">
        {bottomNavItems.map((item) => (
          <div key={item.id} className="relative group">
            <div
              onClick={() => {
                onNavigate(item.id, item.label);
                onMobileClose?.();
              }}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors rounded-lg
                ${currentPage === item.id
                  ? 'text-brand'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }
                ${!isMobile && isCollapsed ? 'justify-center' : ''}
              `}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {(isMobile || !isCollapsed) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </div>
            {/* Tooltip for collapsed state */}
            {!isMobile && isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-charcoal dark:bg-white text-white dark:text-charcoal text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-charcoal dark:border-r-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-shrink-0 bg-[var(--surface)] dark:bg-surface-dark border-r border-[var(--border)] flex-col z-40 transition-[width] duration-300 ease-in-out overflow-x-hidden
          ${isCollapsed ? 'w-16' : 'w-[260px]'}
        `}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-[var(--surface)] dark:bg-surface-dark border-r border-[var(--border)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {sidebarContent(true)}
      </aside>
    </>
  );
}

export default Sidebar;
