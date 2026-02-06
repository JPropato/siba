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
  (
    {
      className,
      label,
      error,
      value,
      onChange,
      icon,
      id,
      disabled,
      placeholder = 'Seleccionar fecha...',
    },
    ref
  ) => {
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
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
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
      return (
        d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day
      );
    };

    const isToday = (day: number) => {
      const today = new Date();
      return (
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === day
      );
    };

    const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR') : '';

    return (
      <div
        className={cn('space-y-1.5 w-full relative', className)}
        ref={(node) => {
          if (containerRef) {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        id={id}
      >
        {label && (
          <label
            id={`${id}-label`}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="dialog"
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-expanded={isOpen}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={cn(
            'flex items-center w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all select-none',
            !disabled && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
            isOpen && 'border-brand ring-1 ring-brand/20',
            disabled && 'opacity-60 cursor-not-allowed',
            error && 'border-red-500',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'
          )}
        >
          <div className="mr-3 text-slate-400">{icon || <CalendarIcon className="h-4 w-4" />}</div>

          <span className={cn('flex-1', !value && 'text-slate-400 dark:text-slate-600')}>
            {displayValue || placeholder}
          </span>

          {value && (
            <button
              onClick={handleClear}
              className="min-h-9 min-w-9 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors -mr-1"
              aria-label="Limpiar fecha"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        {isOpen && (
          <>
            {/* Backdrop para móvil */}
            <div
              className="fixed inset-0 bg-slate-900/40 z-[99] sm:hidden"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            {/* Calendario - Modal centrado en móvil, dropdown en desktop */}
            <div
              className={cn(
                'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] animate-in fade-in duration-200',
                // Móvil: Modal centrado
                'fixed inset-x-4 top-1/2 -translate-y-1/2 p-5 sm:p-4',
                // Desktop: Dropdown
                'sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:translate-y-0 sm:w-[280px]'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                {/* Botones de navegación con 44px touch target */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevMonth();
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 -ml-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="font-bold text-sm sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  {months[currentMonth]} {currentYear}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextMonth();
                  }}
                  className="min-h-11 min-w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 -mr-2"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysShort.map((d) => (
                  <div
                    key={d}
                    className="text-[10px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center uppercase h-8 flex items-center justify-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Touch targets de 44px en móvil, 32px en desktop */}
                {Array.from({ length: offset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-11 sm:h-8" />
                ))}
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectDay(day);
                    }}
                    className={cn(
                      'h-11 sm:h-8 text-sm sm:text-xs font-medium rounded-lg flex items-center justify-center transition-all',
                      'hover:bg-brand/10 hover:text-brand active:scale-95',
                      isSelected(day)
                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                        : 'text-slate-700 dark:text-slate-300',
                      isToday(day) && !isSelected(day) && 'text-brand border border-brand/20'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                {/* Botones de acción con 44px height */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToday();
                  }}
                  className="min-h-11 px-4 text-sm sm:text-[11px] font-bold text-brand uppercase tracking-wider hover:underline flex items-center"
                >
                  Hoy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="min-h-11 px-4 text-sm sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 flex items-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <p id={`${id}-error`} role="alert" className="text-[11px] font-medium text-red-500 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
