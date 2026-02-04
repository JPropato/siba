---
name: siba-caching
description: Estrategias de caché con TanStack Query y optimistic updates
---

# SIBA Caching

Lineamientos para implementar caché y actualizaciones optimistas.

## Cuándo Usar

- Configurar **caché de queries**
- Implementar **optimistic updates**
- Invalidar caché tras **mutaciones**
- Prefetch para **navegación rápida**

---

## Configuración de QueryClient

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - datos "frescos"
      gcTime: 30 * 60 * 1000, // 30 min - mantener en caché
      refetchOnWindowFocus: false, // No refetch al volver a la pestaña
      refetchOnReconnect: true, // Sí refetch al reconectar
      retry: 1, // 1 reintento en error
    },
  },
});
```

---

## StaleTime por Tipo de Datos

| Tipo de Datos    | staleTime  | Razón                        |
| ---------------- | ---------- | ---------------------------- |
| Roles, Rubros    | `Infinity` | Casi nunca cambian           |
| Clientes, Sedes  | `10 min`   | Cambian poco                 |
| Tickets (lista)  | `30 seg`   | Cambian frecuente            |
| Ticket (detalle) | `1 min`    | Importante estar actualizado |
| Usuario actual   | `Infinity` | Solo cambia en login         |

```typescript
// Datos estáticos
const { data: roles } = useQuery({
  queryKey: ['roles'],
  queryFn: fetchRoles,
  staleTime: Infinity,
});

// Datos que cambian poco
const { data: clientes } = useQuery({
  queryKey: ['clientes'],
  queryFn: fetchClientes,
  staleTime: 10 * 60 * 1000, // 10 min
});

// Datos dinámicos
const { data: tickets } = useQuery({
  queryKey: ['tickets', filters],
  queryFn: () => fetchTickets(filters),
  staleTime: 30 * 1000, // 30 seg
});
```

---

## Invalidación de Caché

```typescript
import { useQueryClient, useMutation } from '@tanstack/react-query';

const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TicketInput) => api.post('/tickets', data),
    onSuccess: () => {
      // Invalidar lista de tickets
      queryClient.invalidateQueries({ queryKey: ['tickets'] });

      // También invalidar dashboard si muestra contadores
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Invalidación selectiva
queryClient.invalidateQueries({ queryKey: ['tickets'] }); // Todas las queries de tickets
queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] }); // Solo la lista
queryClient.invalidateQueries({ queryKey: ['ticket', id] }); // Solo un ticket específico
```

---

## Optimistic Updates

```typescript
const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      api.patch(`/tickets/${id}/estado`, { estado }),

    // Optimistic update
    onMutate: async ({ id, estado }) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Snapshot del estado anterior
      const previousTickets = queryClient.getQueryData(['tickets']);

      // Actualizar optimistamente
      queryClient.setQueryData(['tickets'], (old: Ticket[]) =>
        old?.map((t) => (t.id === id ? { ...t, estado } : t))
      );

      // Retornar contexto para rollback
      return { previousTickets };
    },

    // Rollback en error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tickets'], context?.previousTickets);
      toast.error('Error al cambiar estado');
    },

    // Refetch para sincronizar
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
```

---

## Prefetching

```typescript
// Prefetch al hover
const TicketRow = ({ ticket }: { ticket: Ticket }) => {
    const queryClient = useQueryClient();

    const handleMouseEnter = () => {
        queryClient.prefetchQuery({
            queryKey: ['ticket', ticket.id],
            queryFn: () => fetchTicket(ticket.id),
            staleTime: 60 * 1000, // Solo prefetch si datos > 1 min
        });
    };

    return (
        <tr onMouseEnter={handleMouseEnter}>
            ...
        </tr>
    );
};

// Prefetch en navegación
const navigate = useNavigate();
const queryClient = useQueryClient();

const goToDetail = (id: number) => {
    queryClient.prefetchQuery({
        queryKey: ['ticket', id],
        queryFn: () => fetchTicket(id),
    });
    navigate(`/tickets/${id}`);
};
```

---

## Placeholder Data

```typescript
// Usar datos de la lista mientras carga el detalle
const { data: ticket } = useQuery({
  queryKey: ['ticket', id],
  queryFn: () => fetchTicket(id),
  placeholderData: () => {
    // Buscar en la lista cacheada
    const tickets = queryClient.getQueryData<Ticket[]>(['tickets']);
    return tickets?.find((t) => t.id === id);
  },
});
```

---

## Initial Data vs Placeholder

```typescript
// initialData: Se considera "fresco", no hace fetch
const { data } = useQuery({
  queryKey: ['ticket', id],
  queryFn: fetchTicket,
  initialData: ticketFromList,
  initialDataUpdatedAt: Date.now() - 60000, // Hace 1 minuto
});

// placeholderData: Se muestra mientras carga, SIEMPRE hace fetch
const { data, isPlaceholderData } = useQuery({
  queryKey: ['ticket', id],
  queryFn: fetchTicket,
  placeholderData: ticketFromList,
});
```

---

## Patrones de Query Keys

```typescript
// Estructura jerárquica
const queryKeys = {
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters: Filters) => [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.tickets.details(), id] as const,
  },
};

// Uso
useQuery({ queryKey: queryKeys.tickets.list({ estado: 'NUEVO' }) });
useQuery({ queryKey: queryKeys.tickets.detail(123) });

// Invalidar toda la familia
queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
```

---

## Checklist

- [ ] staleTime configurado por tipo de dato
- [ ] Invalidar queries después de mutaciones
- [ ] Optimistic updates para UX instantánea
- [ ] Prefetch en hover/navegación
- [ ] Query keys jerárquicas y consistentes
- [ ] placeholderData para transiciones suaves
