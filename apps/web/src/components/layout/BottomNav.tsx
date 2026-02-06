import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, HardHat, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'tickets', label: 'Tickets', icon: ClipboardList, path: '/dashboard/tickets' },
  { id: 'clients', label: 'Clientes', icon: Users, path: '/dashboard/clients' },
  { id: 'obras', label: 'Obras', icon: HardHat, path: '/dashboard/obras' },
];

const MORE_ITEMS = [
  { label: 'Zonas', path: '/dashboard/zones' },
  { label: 'Sedes', path: '/dashboard/sedes' },
  { label: 'Vehículos', path: '/dashboard/vehicles' },
  { label: 'Materiales', path: '/dashboard/materials' },
  { label: 'Empleados', path: '/dashboard/empleados' },
  { label: 'Finanzas', path: '/dashboard/finanzas' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname.startsWith(item.path));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-20 left-4 right-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMore(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-brand/10 text-brand font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative ${
                  active ? 'text-brand' : 'text-slate-400'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </motion.button>
            );
          })}

          {/* More button */}
          <motion.button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative ${
              isMoreActive || showMore ? 'text-brand' : 'text-slate-400'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {isMoreActive && !showMore && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-bold">Más</span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}
