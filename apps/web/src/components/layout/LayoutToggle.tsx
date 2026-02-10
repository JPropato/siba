import { useState, useRef, useEffect } from 'react';
import { PanelLeft, PanelTop, Check } from 'lucide-react';
import { useLayoutStore } from '../../hooks/useLayoutStore';

const options = [
  { id: 'sidebar' as const, label: 'Barra Lateral', icon: PanelLeft },
  { id: 'topnav' as const, label: 'Nav. Superior', icon: PanelTop },
];

export function LayoutToggle() {
  const { layout, setLayout } = useLayoutStore();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ActiveIcon = layout === 'sidebar' ? PanelLeft : PanelTop;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-[var(--brand-color)] transition-colors hover:bg-[var(--brand-light)]/10 rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--brand-color)]/50"
        title="Cambiar Layout"
        aria-label="Cambiar Layout"
      >
        <ActiveIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 px-2">
            Diseño
          </h3>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isActive = layout === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setLayout(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
