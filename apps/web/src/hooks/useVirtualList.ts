import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
}

/**
 * Hook para virtualizar listas de elementos.
 *
 * Útil para tablas/listas con 100+ elementos donde el renderizado
 * completo causaría problemas de rendimiento.
 *
 * @example
 * const { parentRef, virtualItems, totalSize } = useVirtualList({
 *   items: sedes,
 *   itemHeight: 56,
 * });
 *
 * return (
 *   <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
 *     <div style={{ height: totalSize }}>
 *       {virtualItems.map(({ index, start, size }) => (
 *         <div
 *           key={items[index].id}
 *           style={{
 *             position: 'absolute',
 *             top: 0,
 *             left: 0,
 *             width: '100%',
 *             height: size,
 *             transform: `translateY(${start}px)`,
 *           }}
 *         >
 *           {renderRow(items[index])}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 */
export function useVirtualList<T>({ items, itemHeight, overscan = 5 }: UseVirtualListOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Memoize para evitar re-cálculos innecesarios
  const mappedItems = useMemo(
    () =>
      virtualItems.map((virtualRow) => ({
        ...virtualRow,
        item: items[virtualRow.index],
      })),
    [virtualItems, items]
  );

  return {
    parentRef,
    virtualItems: mappedItems,
    totalSize,
    // Para debug/info
    visibleCount: virtualItems.length,
    totalCount: items.length,
  };
}

export default useVirtualList;
