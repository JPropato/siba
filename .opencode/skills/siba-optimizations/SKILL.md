---
name: siba-optimizations
description: Patrones de optimización de performance para React y API
---

# SIBA Optimizations

Lineamientos para optimizar el rendimiento del frontend y backend.

## Cuándo Usar

- El **rendimiento es lento**
- Componentes **re-renderizan** innecesariamente
- Queries de **API lentas**
- Bundle **muy grande**

---

## Frontend: React Optimizations

### React.memo

```tsx
// Evita re-renders si props no cambian
import { memo } from 'react';

interface TicketCardProps {
  ticket: Ticket;
  onSelect: (id: number) => void;
}

export const TicketCard = memo(({ ticket, onSelect }: TicketCardProps) => {
  return <div onClick={() => onSelect(ticket.id)}>{ticket.descripcion}</div>;
});

// ⚠️ SOLO usar cuando:
// - El componente renderiza frecuentemente
// - Las props no cambian a menudo
// - El render es costoso
```

### useMemo

```tsx
// Memorizar cálculos costosos
import { useMemo } from 'react';

const TicketList = ({ tickets, filter }: Props) => {
  // ✅ Solo recalcula cuando tickets o filter cambian
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => t.estado === filter);
  }, [tickets, filter]);

  // ❌ NO usar para operaciones simples
  const count = useMemo(() => tickets.length, [tickets]); // Innecesario
};
```

### useCallback

```tsx
// Memorizar funciones para evitar re-renders de hijos
import { useCallback } from 'react';

const ParentComponent = () => {
  // ✅ La función mantiene la misma referencia
  const handleClick = useCallback((id: number) => {
    console.log('Clicked:', id);
  }, []);

  return <ChildComponent onClick={handleClick} />;
};
```

---

## Lazy Loading

### Componentes

```tsx
import { lazy, Suspense } from 'react';

// Cargar componente solo cuando se necesita
const TicketDrawer = lazy(() => import('./components/TicketDrawer'));

const Page = () => (
  <Suspense fallback={<div>Cargando...</div>}>
    <TicketDrawer />
  </Suspense>
);
```

### Rutas

```tsx
// routes.tsx
import { lazy, Suspense } from 'react';

const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));

const routes = [
  {
    path: '/tickets',
    element: (
      <Suspense fallback={<PageLoader />}>
        <TicketsPage />
      </Suspense>
    ),
  },
];
```

---

## Virtual Lists

```tsx
// Para listas muy largas (>100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // altura estimada de cada item
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## TanStack Query Optimizations

```typescript
// Configuración óptima
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos antes de refetch
      gcTime: 10 * 60 * 1000, // 10 minutos en cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Query con staleTime largo para datos que cambian poco
const { data: roles } = useQuery({
  queryKey: ['roles'],
  queryFn: fetchRoles,
  staleTime: Infinity, // Nunca refetch automático
});

// Prefetch para navegación
const prefetchTicket = (id: number) => {
  queryClient.prefetchQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id),
  });
};
```

---

## Backend: Query Optimization

### Índices en Prisma

```prisma
model Ticket {
    id          Int       @id @default(autoincrement())
    estado      String
    sucursalId  Int
    fechaCreacion DateTime @default(now())

    // Índices para queries frecuentes
    @@index([estado])
    @@index([sucursalId])
    @@index([fechaCreacion])
    @@index([estado, sucursalId]) // Índice compuesto
}
```

### Select vs Include

```typescript
// ❌ Trae todo (lento)
const tickets = await prisma.ticket.findMany({
  include: {
    sucursal: true,
    tecnico: true,
    historial: true,
  },
});

// ✅ Solo lo necesario (rápido)
const tickets = await prisma.ticket.findMany({
  select: {
    id: true,
    descripcion: true,
    estado: true,
    sucursal: { select: { nombre: true } },
    tecnico: { select: { nombre: true } },
  },
});
```

### Evitar N+1

```typescript
// ❌ N+1 queries
const tickets = await prisma.ticket.findMany();
for (const ticket of tickets) {
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: ticket.sucursalId },
  });
}

// ✅ Una sola query con include
const tickets = await prisma.ticket.findMany({
  include: { sucursal: true },
});
```

---

## Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

---

## Checklist

- [ ] `React.memo` en componentes que re-renderizan mucho
- [ ] `useMemo` para cálculos costosos
- [ ] `useCallback` para funciones pasadas a hijos memorizados
- [ ] Lazy loading en rutas y componentes pesados
- [ ] `staleTime` apropiado en queries
- [ ] `select` en lugar de `include` en Prisma
- [ ] Índices en campos de búsqueda frecuente
- [ ] Code splitting para reducir bundle inicial
