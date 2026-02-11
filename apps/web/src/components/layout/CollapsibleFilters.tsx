import { useState, type ReactNode } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CollapsibleFiltersProps {
  children: ReactNode;
  /** Número de filtros activos (muestra badge si > 0) */
  activeFiltersCount?: number;
  /** Título del botón colapsable (default: "Filtros") */
  title?: string;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Estado inicial (default: false = colapsado en móvil) */
  defaultOpen?: boolean;
}

/**
 * CollapsibleFilters Component
 *
 * Contenedor de filtros que se colapsa en móvil y se expande en desktop.
 * Sigue el patrón establecido en TicketsPage.
 *
 * @example
 * <CollapsibleFilters activeFiltersCount={2}>
 *   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 *     <Input placeholder="Buscar..." />
 *     <Select options={...} />
 *   </div>
 * </CollapsibleFilters>
 */
export function CollapsibleFilters({
  children,
  activeFiltersCount = 0,
  title = 'Filtros',
  className,
  defaultOpen = false,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
        className
      )}
    >
      {/* Toggle Button - Solo visible en móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:hidden flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-expanded={isOpen}
        aria-controls="collapsible-filters-content"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
          <Filter className="h-4 w-4" />
          <span>{title}</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-brand text-white text-xs font-semibold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Filters Content - Expandible en móvil, siempre visible en desktop */}
      <div
        id="collapsible-filters-content"
        className={cn('p-4 md:block', isOpen ? 'block' : 'hidden')}
      >
        {children}
      </div>
    </div>
  );
}

export default CollapsibleFilters;
