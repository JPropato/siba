import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronDown, Search, Loader2, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface SelectProps {
  label?: string;
  error?: string;
  isLoading?: boolean;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode; // Left icon in trigger
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const Select = ({
  className,
  label,
  error,
  isLoading,
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción...',
  icon: TriggerIcon,
  id,
  disabled,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => opt.value === value || opt.value.toString() === value?.toString()
  );

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: SelectOption) => {
    if (disabled) return;
    onChange?.(option.value.toString());
    setIsOpen(false);
  };

  return (
    <div className={cn('space-y-1.5 w-full relative', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'flex items-center w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all select-none',
          !disabled && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
          isOpen && 'border-brand ring-1 ring-brand/20',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500'
        )}
      >
        {TriggerIcon && <div className="mr-3 text-slate-400">{TriggerIcon}</div>}

        <span
          className={cn('flex-1 truncate', !selectedOption && 'text-slate-400 dark:text-slate-600')}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="ml-2 text-slate-400 flex items-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          ) : (
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[150] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-72">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400 italic">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all mx-1 mb-1',
                    'hover:bg-brand/10 hover:text-brand',
                    selectedOption?.value === option.value
                      ? 'bg-brand/5 text-brand'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  {option.icon && <div className="shrink-0 text-slate-400">{option.icon}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-[11px] opacity-70 truncate uppercase tracking-wider font-bold">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {selectedOption?.value === option.value && <Check className="h-4 w-4 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] font-medium text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

Select.displayName = 'Select';
