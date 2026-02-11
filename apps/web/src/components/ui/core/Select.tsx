import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
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
  const [isClosing, setIsClosing] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);

  // Cierre suave con animación de salida
  const closeDropdown = useCallback(() => {
    setIsClosing(true);
    closingTimer.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setDropdownPos(null);
    }, 100);
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (closingTimer.current) clearTimeout(closingTimer.current);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Calcular posición del dropdown (portal)
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const update = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const maxH = 288; // max-h-72
      const openUp = spaceBelow < maxH && rect.top > spaceBelow;
      setDropdownPos({
        top: rect.bottom + 8,
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  // Reset search and focus when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setFocusedIndex(-1);
    }
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
    closeDropdown();
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            setIsOpen(true);
          } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            e.preventDefault();
            handleSelect(filteredOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeDropdown();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
          }
          break;
        case 'Home':
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(0);
          }
          break;
        case 'End':
          if (isOpen) {
            e.preventDefault();
            setFocusedIndex(filteredOptions.length - 1);
          }
          break;
      }
    },
    [disabled, isOpen, focusedIndex, filteredOptions, onChange]
  );

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      focusedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

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

      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        className={cn(
          'flex items-center w-full h-9 sm:h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm transition-all select-none text-left',
          !disabled && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
          isOpen && 'border-brand ring-1 ring-brand/20',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'
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
      </button>

      {(isOpen || isClosing) &&
        !disabled &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: dropdownPos.left,
              width: dropdownPos.width || undefined,
              ...(dropdownPos.openUp ? { bottom: dropdownPos.bottom } : { top: dropdownPos.top }),
            }}
            className={cn(
              'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-72',
              isClosing ? 'animate-out fade-out duration-100' : 'animate-in fade-in duration-150'
            )}
          >
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
                  onKeyDown={handleKeyDown}
                  aria-label="Buscar opciones"
                  className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Options List */}
            <div
              ref={listRef}
              role="listbox"
              aria-label={label || 'Opciones'}
              className="flex-1 overflow-y-auto custom-scrollbar p-1"
            >
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400 italic">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={selectedOption?.value === option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all mx-1 mb-1',
                      'hover:bg-brand/10 hover:text-brand',
                      selectedOption?.value === option.value
                        ? 'bg-brand/5 text-brand'
                        : 'text-slate-700 dark:text-slate-300',
                      focusedIndex === index && 'bg-brand/10 ring-2 ring-brand/30'
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
                    {selectedOption?.value === option.value && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
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
