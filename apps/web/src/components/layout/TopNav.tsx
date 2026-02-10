import { useState, useMemo, useRef, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import logoBauman from '../../assets/logo-bauman.png';
import { ChevronDown } from 'lucide-react';
import { type NavItem, allNavItems, bottomNavItems, iconMap, menuPermissions } from './nav-data';

interface TopNavProps {
  currentPage: string;
  onNavigate: (pageId: string, label: string, parentLabel?: string) => void;
}

export function TopNav({ currentPage, onNavigate }: TopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    return allNavItems
      .map((item) => {
        if (item.subItems) {
          const filteredSubs = item.subItems.filter((sub) => {
            if (!sub.permission) return true;
            if (isSuperAdmin()) return true;
            return hasPermission(sub.permission);
          });
          if (filteredSubs.length === 0) return null;
          return { ...item, subItems: filteredSubs };
        }
        const requiredPerm = menuPermissions[item.id];
        if (requiredPerm === null) return item;
        if (isSuperAdmin()) return item;
        if (Array.isArray(requiredPerm)) return hasAnyPermission(requiredPerm) ? item : null;
        return hasPermission(requiredPerm) ? item : null;
      })
      .filter(Boolean) as NavItem[];
  }, [hasPermission, hasAnyPermission, isSuperAdmin]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isItemActive = (item: NavItem): boolean => {
    if (currentPage === item.id) return true;
    if (item.subItems) {
      return item.subItems.some((sub) => currentPage === sub.id);
    }
    return false;
  };

  const handleItemClick = (item: NavItem) => {
    if (item.subItems) {
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      onNavigate(item.id, item.label);
      setOpenDropdown(null);
    }
  };

  const handleSubItemClick = (subItem: { id: string; label: string }, parentLabel: string) => {
    onNavigate(subItem.id, subItem.label, parentLabel);
    setOpenDropdown(null);
  };

  return (
    <nav
      ref={navRef}
      className="hidden lg:flex items-center h-10 px-4 border-b border-[var(--border)] bg-[var(--surface)] dark:bg-surface-dark overflow-x-auto scrollbar-none"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6 flex-shrink-0">
        <img
          src={logoBauman}
          alt="Bauman"
          className="h-6 w-auto object-contain dark:brightness-0 dark:invert"
        />
        <span className="text-sm font-bold text-slate-900 dark:text-white">SIBA</span>
      </div>

      {/* Nav Items */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon];
          const active = isItemActive(item);
          const isOpen = openDropdown === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'text-brand bg-brand/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span>{item.label}</span>
                {item.subItems && (
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Dropdown */}
              {item.subItems && isOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleSubItemClick(subItem, item.label)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentPage === subItem.id
                          ? 'text-brand font-medium bg-brand/5'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Config item */}
        {bottomNavItems.map((item) => {
          const IconComponent = iconMap[item.icon];
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id, item.label);
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'text-brand bg-brand/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TopNav;
