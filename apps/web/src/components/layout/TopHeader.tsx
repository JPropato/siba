import { useState } from 'react';
import { ThemeSettings } from './ThemeSettings';
import { useAuthStore } from '../../stores/auth-store';
import api from '../../lib/api';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function TopHeader({
  onToggleSidebar,
  isSidebarCollapsed,
  darkMode,
  onToggleDarkMode,
}: TopHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[var(--surface)]/80 dark:bg-bg-dark/50 backdrop-blur-md z-30 transition-colors">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-brand transition-colors"
          title={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <span className="material-symbols-outlined lg:hidden">menu</span>
          <span className="material-symbols-outlined hidden lg:block">
            {isSidebarCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>

        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-brand">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar reportes o datos..."
            className="bg-slate-100 dark:bg-white/5 border border-[var(--border)] rounded-lg pl-10 pr-16 py-1.5 w-64 text-sm focus:ring-1 focus:ring-brand focus:border-brand transition-all outline-none text-[var(--foreground)]"
            readOnly
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-400">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-400">K</kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Theme Color Picker */}
        <ThemeSettings />

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-400 hover:text-brand transition-colors hover:bg-brand/5 rounded-lg flex items-center justify-center"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-brand transition-colors hover:bg-brand/5 rounded-lg">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-brand rounded-full ring-2 ring-[var(--surface)] dark:ring-bg-dark" />
        </button>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-[var(--border)] mx-1" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 pl-2 group cursor-pointer outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[var(--foreground)] leading-none">
                {user ? `${user.nombre} ${user.apellido}` : 'Usuario'}
              </p>
              <p className="text-[10px] text-[var(--muted)] font-medium">
                {user?.roles?.[0] || 'Invitado'}
              </p>
            </div>
            <div className="size-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:border-brand/40 transition-all">
              <span className="material-symbols-outlined text-brand">person</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  onClick={() => { setIsMenuOpen(false); /* Navigate to profile */ }}
                >
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  Mi Perfil
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
