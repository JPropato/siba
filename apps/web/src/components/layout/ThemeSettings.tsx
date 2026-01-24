import { useThemeStore } from '../../hooks/useThemeColor';
import { useState, useRef, useEffect } from 'react';

const colors = [
    { id: 'gold', label: 'Gold (Oficial)', color: '#bd8e3d' },
    { id: 'blue', label: 'Corporate Blue', color: '#3b82f6' },
    { id: 'emerald', label: 'Emerald Green', color: '#10b981' },
    { id: 'violet', label: 'Royal Violet', color: '#8b5cf6' },
    { id: 'rose', label: 'Vibrant Rose', color: '#f43f5e' },
    { id: 'charcoal', label: 'Minimal Dark', color: '#334155' },
] as const;

export function ThemeSettings() {
    const { color: activeColor, setColor } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-[var(--brand-color)] transition-colors hover:bg-[var(--brand-light)]/10 rounded-lg"
                title="Personalizar Tema"
            >
                <span className="material-symbols-outlined text-[20px]">palette</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 px-1">
                        Color Principal
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setColor(c.id)}
                                className={`
                                    group relative w-full aspect-square rounded-lg border flex items-center justify-center transition-all
                                    ${activeColor === c.id
                                        ? 'border-[var(--brand-color)] ring-2 ring-[var(--brand-color)]/20'
                                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                    }
                                `}
                                title={c.label}
                                style={{ backgroundColor: `${c.color}15` }} // 15 = 10% opacity hex
                            >
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm"
                                    style={{ backgroundColor: c.color }}
                                />
                                {activeColor === c.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[10px] text-[var(--brand-color)] font-bold bg-white dark:bg-black rounded-full p-0.5 shadow-sm">
                                            check
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
