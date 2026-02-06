import { useRef, memo, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  className?: string;
  render: (item: T, index: number) => ReactNode;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowHeight?: number;
  maxHeight?: string;
  onRowClick?: (item: T) => void;
  getRowKey: (item: T) => string | number;
  className?: string;
}

/**
 * VirtualTable - Tabla virtualizada para grandes conjuntos de datos.
 *
 * Solo renderiza las filas visibles en el viewport, mejorando significativamente
 * el rendimiento cuando hay 100+ registros.
 *
 * @example
 * <VirtualTable
 *   data={tickets}
 *   columns={[
 *     { key: 'code', header: 'Código', render: (t) => t.codigo },
 *     { key: 'desc', header: 'Descripción', render: (t) => t.descripcion },
 *   ]}
 *   getRowKey={(t) => t.id}
 *   rowHeight={56}
 *   maxHeight="calc(100vh - 300px)"
 * />
 */
function VirtualTableInner<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No se encontraron registros.',
  rowHeight = 48,
  maxHeight = '500px',
  onRowClick,
  getRowKey,
  className,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5, // Renderiza 5 filas extra arriba/abajo para scroll suave
  });

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
        <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                'px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 text-sm',
                col.className
              )}
              style={{ width: col.width, minWidth: col.width }}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto bg-white dark:bg-slate-950"
        style={{ maxHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            return (
              <div
                key={getRowKey(item)}
                className={cn(
                  'absolute top-0 left-0 w-full flex border-b border-slate-100 dark:border-slate-800',
                  'hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={cn('px-3 py-2.5 flex items-center text-sm', col.className)}
                    style={{ width: col.width, minWidth: col.width }}
                  >
                    {col.render(item, virtualRow.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer con info de virtualización */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        Mostrando {virtualItems.length} de {data.length} registros
      </div>
    </div>
  );
}

// Memo wrapper para componente genérico
export const VirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner;

export default VirtualTable;
