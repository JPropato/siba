import { useMemo, useCallback } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import logoBauman from '../../assets/logo-bauman.png';
import { X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { type FlatNavItem, standaloneItems, navSections, sidebarBottomItems } from './nav-data';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentPage: string;
  onNavigate: (pageId: string, label: string, parentLabel?: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  currentPage,
  onNavigate,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canView = useCallback(
    (item: FlatNavItem) => {
      if (!item.permission) return true;
      if (isSuperAdmin()) return true;
      return hasPermission(item.permission);
    },
    [hasPermission, isSuperAdmin]
  );

  const filteredStandalone = useMemo(() => standaloneItems.filter(canView), [canView]);

  const filteredSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter(canView),
        }))
        .filter((section) => section.items.length > 0),
    [canView]
  );

  const handleClick = (item: FlatNavItem, parentLabel?: string) => {
    onNavigate(item.id, item.label, parentLabel);
    onMobileClose?.();
  };

  // ── Expanded item (full sidebar) ───────────────────────────
  const renderItem = (item: FlatNavItem, parentLabel?: string) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleClick(item, parentLabel)}
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-brand/10 text-brand'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-brand rounded-r-full" />
        )}
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  // ── Collapsed item (icon only + tooltip) ───────────────────
  const renderCollapsedItem = (item: FlatNavItem, parentLabel?: string) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleClick(item, parentLabel)}
        title={item.label}
        className={cn(
          'group relative flex w-full items-center justify-center rounded-md p-2 transition-colors',
          isActive
            ? 'bg-brand/10 text-brand'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-brand rounded-r-full" />
        )}
        <Icon className="h-[18px] w-[18px]" />
      </button>
    );
  };

  // ── Full sidebar content (expanded) ────────────────────────
  const expandedContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logoBauman}
            alt="Bauman"
            className="h-7 w-auto object-contain dark:brightness-0 dark:invert flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              SIBA
            </span>
            <span className="text-[9px] uppercase font-semibold tracking-[0.08em] text-slate-400">
              Sistema Bauman
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
          title="Colapsar menu"
          aria-label="Colapsar menu"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 space-y-4">
        {filteredStandalone.length > 0 && (
          <div className="space-y-0.5">{filteredStandalone.map((item) => renderItem(item))}</div>
        )}

        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-0.5">
            <h3 className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.label}
            </h3>
            {section.items.map((item) => renderItem(item, section.label))}
          </div>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="mt-auto border-t border-[var(--border)] px-3 py-3 space-y-0.5">
        {sidebarBottomItems.map((item) => renderItem(item))}
      </div>
    </div>
  );

  // ── Collapsed sidebar content (icons only) ────────────────
  const collapsedContent = (
    <div className="flex h-full flex-col items-center">
      {/* Logo icon only */}
      <div className="flex items-center justify-center py-4 px-2">
        <img
          src={logoBauman}
          alt="Bauman"
          className="h-7 w-7 object-contain dark:brightness-0 dark:invert"
        />
      </div>

      {/* Navigation - icons only */}
      <nav className="flex-1 overflow-y-auto w-full px-2 pb-2 space-y-3">
        {filteredStandalone.length > 0 && (
          <div className="space-y-0.5">
            {filteredStandalone.map((item) => renderCollapsedItem(item))}
          </div>
        )}

        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-0.5">
            <div className="h-px bg-[var(--border)] mx-1 my-1.5" />
            {section.items.map((item) => renderCollapsedItem(item, section.label))}
          </div>
        ))}
      </nav>

      {/* Bottom - icon only */}
      <div className="mt-auto border-t border-[var(--border)] w-full px-2 py-3 space-y-0.5">
        {sidebarBottomItems.map((item) => renderCollapsedItem(item))}
      </div>

      {/* Expand button */}
      <div className="border-t border-[var(--border)] w-full px-2 py-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
          title="Expandir menu"
          aria-label="Expandir menu"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-shrink-0 flex-col bg-[var(--surface)] dark:bg-surface-dark z-40 transition-[width] duration-300 ease-in-out border-r border-[var(--border)] overflow-hidden',
          isCollapsed ? 'w-[56px]' : 'w-[240px]'
        )}
      >
        {isCollapsed ? collapsedContent : expandedContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer (always expanded) */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-[280px] bg-[var(--surface)] dark:bg-surface-dark border-r border-[var(--border)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {expandedContent}
      </aside>
    </>
  );
}

export default Sidebar;
