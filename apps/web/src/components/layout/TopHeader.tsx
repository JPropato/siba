import { useState } from 'react';
import { ThemeSettings } from './ThemeSettings';
import { useAuthStore } from '../../stores/auth-store';
import api from '../../lib/api';
import { Menu, Search, Sun, Moon, Bell, User, LogOut } from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function TopHeader({ onToggleSidebar, darkMode, onToggleDarkMode }: TopHeaderProps) {
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

  const openCommandMenu = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="h-12 flex items-center justify-between px-3 md:px-4 lg:px-6 border-b border-[var(--border)] bg-[var(--surface)]/80 dark:bg-bg-dark/50 backdrop-blur-md z-30 transition-colors">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-slate-400 hover:text-brand transition-colors rounded-md"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search button */}
        <button
          onClick={openCommandMenu}
          className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-white/5 border border-[var(--border)] rounded-md transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline text-xs">Buscar...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 ml-2">
            <span className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-400">
              Ctrl
            </span>
            <span className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-bold text-slate-400">
              K
            </span>
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5">
        <ThemeSettings />

        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-400 hover:text-brand transition-colors hover:bg-brand/5 rounded-md"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          className="relative p-2 text-slate-400 hover:text-brand transition-colors hover:bg-brand/5 rounded-md"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 size-1.5 bg-brand rounded-full ring-2 ring-[var(--surface)] dark:ring-bg-dark" />
        </button>

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 pl-1 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-md"
            aria-label="Menu de usuario"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[var(--foreground)] leading-none">
                {user ? `${user.nombre} ${user.apellido}` : 'Usuario'}
              </p>
              <p className="text-[10px] text-[var(--muted)] font-medium">
                {user?.roles?.[0] || 'Invitado'}
              </p>
            </div>
            <div className="size-8 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:border-brand/40 transition-all">
              <User className="h-4 w-4 text-brand" />
            </div>
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesion
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
