import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePrefetchOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  delay?: number; // Delay antes de prefetch (default: 150ms)
  staleTime?: number; // Tiempo que los datos se consideran frescos
}

/**
 * Hook para prefetching de datos en hover
 *
 * @example
 * const prefetchHandlers = usePrefetch({
 *   queryKey: ['ticket', ticketId],
 *   queryFn: () => api.get(`/tickets/${ticketId}`).then(r => r.data),
 * });
 *
 * <tr {...prefetchHandlers}>...</tr>
 */
export function usePrefetch<T>({
  queryKey,
  queryFn,
  delay = 150,
  staleTime = 30 * 1000,
}: UsePrefetchOptions<T>) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay para evitar prefetch en hover accidental
    timeoutRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    }, delay);
  }, [queryClient, queryKey, queryFn, delay, staleTime]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Prefetch inmediato (para usar con onFocus, etc.)
  const prefetchNow = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  }, [queryClient, queryKey, queryFn, staleTime]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus: prefetchNow, // Prefetch en focus para teclado
    prefetchNow,
  };
}

/**
 * Hook para prefetching de lista de items
 * Útil para prefetch de la siguiente página de resultados
 */
export function usePrefetchNextPage<T>({
  queryKey,
  queryFn,
  hasNextPage,
}: {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  hasNextPage: boolean;
}) {
  const queryClient = useQueryClient();

  const prefetchNextPage = useCallback(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 30 * 1000,
      });
    }
  }, [queryClient, queryKey, queryFn, hasNextPage]);

  return { prefetchNextPage };
}
