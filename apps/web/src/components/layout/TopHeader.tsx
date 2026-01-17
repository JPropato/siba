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
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[var(--surface)]/80 dark:bg-bg-dark/50 backdrop-blur-md z-10 transition-colors">
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
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar reportes o datos..."
            className="bg-slate-100 dark:bg-white/5 border border-[var(--border)] rounded-lg pl-10 pr-4 py-1.5 w-64 text-sm focus:ring-1 focus:ring-brand focus:border-brand transition-all outline-none text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[var(--foreground)] leading-none">Usuario Demo</p>
            <p className="text-[10px] text-[var(--muted)] font-medium">Administrador</p>
          </div>
          <div className="size-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center group-hover:border-brand/40 transition-all">
            <span className="material-symbols-outlined text-brand">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
