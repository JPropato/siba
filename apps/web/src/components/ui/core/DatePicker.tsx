import { useState, useRef, useEffect, forwardRef, type ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerProps {
    label?: string;
    error?: string;
    value?: string; // Format: YYYY-MM-DD
    onChange?: (value: string) => void;
    icon?: ReactNode;
    placeholder?: string;
    className?: string;
    id?: string;
    disabled?: boolean;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
    ({ className, label, error, value, onChange, icon, id, disabled, placeholder = 'Seleccionar fecha...' }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
        const containerRef = useRef<HTMLDivElement>(null);

        // Click outside to close
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen]);

        const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const startOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

        const handlePrevMonth = () => {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        };

        const handleNextMonth = () => {
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        };

        const handleSelectDay = (day: number) => {
            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const formatted = date.toISOString().split('T')[0];
            onChange?.(formatted);
            setIsOpen(false);
        };

        const handleToday = () => {
            const today = new Date();
            onChange?.(today.toISOString().split('T')[0]);
            setIsOpen(false);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            onChange?.('');
            setIsOpen(false);
        };

        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const daysShort = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

        const currentYear = viewDate.getFullYear();
        const currentMonth = viewDate.getMonth();
        const totalDays = daysInMonth(currentYear, currentMonth);
        const offset = startOfMonth(currentYear, currentMonth);
        const days = Array.from({ length: totalDays }, (_, i) => i + 1);

        const isSelected = (day: number) => {
            if (!value) return false;
            const d = new Date(value + 'T00:00:00');
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
        };

        const isToday = (day: number) => {
            const today = new Date();
            return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
        };

        const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR') : '';

        return (
            <div className={cn("space-y-1.5 w-full relative", className)} ref={(node) => {
                if (containerRef) {
                    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                }
                if (typeof ref === 'function') ref(node);
                else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }} id={id}>
                {label && (
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {label}
                    </label>
                )}

                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        'flex items-center w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all select-none',
                        !disabled && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
                        isOpen && 'border-brand ring-1 ring-brand/20',
                        disabled && 'opacity-60 cursor-not-allowed',
                        error && 'border-red-500'
                    )}
                >
                    <div className="mr-3 text-slate-400">
                        {icon || <CalendarIcon className="h-4 w-4" />}
                    </div>

                    <span className={cn("flex-1", !value && "text-slate-400 dark:text-slate-600")}>
                        {displayValue || placeholder}
                    </span>

                    {value && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="h-3 w-3 text-slate-400" />
                        </button>
                    )}
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 w-[280px]">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                                {months[currentMonth]} {currentYear}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleNextMonth(); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysShort.map(d => (
                                <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center uppercase">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: offset }).map((_, i) => (<div key={`empty-${i}`} className="h-8" />))}
                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={(e) => { e.stopPropagation(); handleSelectDay(day); }}
                                    className={cn(
                                        "h-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all",
                                        "hover:bg-brand/10 hover:text-brand",
                                        isSelected(day) ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-slate-700 dark:text-slate-300",
                                        isToday(day) && !isSelected(day) && "text-brand border border-brand/20"
                                    )}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <button onClick={(e) => { e.stopPropagation(); handleToday(); }} className="text-[11px] font-bold text-brand uppercase tracking-wider hover:underline">Hoy</button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600">Cerrar</button>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-[11px] font-medium text-red-500 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

DatePicker.displayName = 'DatePicker';
