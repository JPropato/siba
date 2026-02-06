import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  id?: string;
  'aria-labelledby'?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'No se encontraron resultados',
  className,
  disabled = false,
  clearable = false,
  id,
  'aria-labelledby': ariaLabelledBy,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filtrar opciones
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(searchLower));
  }, [options, search]);

  // Reset highlight cuando cambian las opciones filtradas
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Cerrar con click afuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // Focus input cuando se abre
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Scroll al item highlighted
  React.useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.querySelector('[data-highlighted="true"]');
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Tab':
        setOpen(false);
        setSearch('');
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger / Input */}
      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(true)}
        onKeyDown={(e) => {
          if (!disabled && !open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border bg-white dark:bg-slate-950 px-3 text-sm transition-colors',
          'border-slate-200 dark:border-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          open && 'ring-2 ring-brand/20 border-brand',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900',
          !disabled && !open && 'hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
        )}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption?.label || searchPlaceholder}
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400"
            autoComplete="off"
          />
        ) : (
          <span className={cn('flex-1 truncate', !value && 'text-slate-400')}>
            {selectedOption?.label || placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 ml-2">
          {clearable && value && !open && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-150"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-400">{emptyText}</div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  data-highlighted={index === highlightedIndex}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left transition-colors',
                    index === highlightedIndex && 'bg-slate-100 dark:bg-slate-800',
                    value === option.value && 'text-brand font-medium'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === option.value ? 'opacity-100 text-brand' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
