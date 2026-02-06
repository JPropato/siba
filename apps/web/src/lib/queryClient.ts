import { QueryClient } from '@tanstack/react-query';

// QueryClient con configuración optimizada para prefetching y caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos se consideran frescos por 30 segundos
      staleTime: 30 * 1000,
      // Cache se mantiene por 5 minutos después de que no hay observers
      gcTime: 5 * 60 * 1000,
      // Reintentar 1 vez en caso de error
      retry: 1,
      // No refetch automático en window focus (puede ser molesto)
      refetchOnWindowFocus: false,
      // Refetch en reconexión de red
      refetchOnReconnect: true,
    },
  },
});

// Helper para prefetching en hover
export function createPrefetchHandler<T>(queryKey: unknown[], queryFn: () => Promise<T>) {
  let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    onMouseEnter: () => {
      // Delay de 100ms para evitar prefetch en hover accidental
      prefetchTimeout = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 30 * 1000,
        });
      }, 100);
    },
    onMouseLeave: () => {
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
        prefetchTimeout = null;
      }
    },
  };
}
