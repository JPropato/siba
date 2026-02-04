---
name: siba-tables
description: Patrón para tablas de datos en SIBA con paginación, sorting, filtros y acciones
---

# SIBA Tables

Lineamientos para crear tablas de datos consistentes con paginación, ordenamiento y filtros.

## Cuándo Usar

- Crees una **página de listado** (Clientes, Tickets, Sedes, etc.)
- Necesites **paginación** del lado del servidor
- Implementes **ordenamiento** por columnas
- Agregues **filtros** y búsqueda

---

## Estructura de Tabla

```
┌─────────────────────────────────────────────────────────┐
│  Header con título + botón Nuevo                        │
├─────────────────────────────────────────────────────────┤
│  Filtros (búsqueda, selects, fechas)                   │
├─────────────────────────────────────────────────────────┤
│  Tabla con headers ordenables                           │
│  ├── Filas con datos                                   │
│  └── Acciones por fila (ver, editar, eliminar)        │
├─────────────────────────────────────────────────────────┤
│  Paginación (Mostrando X de Y | < 1 2 3 >)            │
└─────────────────────────────────────────────────────────┘
```

---

## Componentes Necesarios

| Componente       | Ubicación                |
| ---------------- | ------------------------ |
| `SortableHeader` | `ui/core/SortableHeader` |
| `EmptyState`     | `ui/EmptyState`          |
| `Button`         | `ui/core/Button`         |
| `Input`          | `ui/core/Input`          |
| `Select`         | `ui/core/Select`         |

---

## Hook de Tabla

```typescript
// hooks/useTableState.ts
import { useState } from 'react';

interface TableState {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
}

export const useTableState = (initialSort = 'fechaCreacion') => {
  const [state, setState] = useState<TableState>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: initialSort,
    sortOrder: 'desc',
    filters: {},
  });

  const setPage = (page: number) => setState((s) => ({ ...s, page }));
  const setSearch = (search: string) => setState((s) => ({ ...s, search, page: 1 }));
  const setFilter = (key: string, value: string) =>
    setState((s) => ({ ...s, filters: { ...s.filters, [key]: value }, page: 1 }));

  const toggleSort = (column: string) => {
    setState((s) => ({
      ...s,
      sortBy: column,
      sortOrder: s.sortBy === column && s.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  return { ...state, setPage, setSearch, setFilter, toggleSort };
};
```

---

## Patrón de Página de Listado

```tsx
// pages/ClientesPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useTableState } from '@/hooks/useTableState';
import { SortableHeader } from '@/components/ui/core/SortableHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/core/Button';
import { Input } from '@/components/ui/core/Input';
import { Plus, Search, Users } from 'lucide-react';

export const ClientesPage = () => {
  const table = useTableState('razonSocial');

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', table.page, table.limit, table.search, table.sortBy, table.sortOrder],
    queryFn: () =>
      api.get('/clientes', {
        params: {
          page: table.page,
          limit: table.limit,
          search: table.search,
          sortBy: table.sortBy,
          sortOrder: table.sortOrder,
        },
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Nuevo Cliente</Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <SortableHeader
                label="Razón Social"
                column="razonSocial"
                currentSort={table.sortBy}
                sortOrder={table.sortOrder}
                onSort={table.toggleSort}
              />
              <SortableHeader label="CUIT" column="cuit" {...sortProps} />
              <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.data.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">{cliente.razonSocial}</td>
                <td className="px-4 py-3">{cliente.cuit}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm">
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {data?.data.length === 0 && (
          <EmptyState icon={Users} title="No hay clientes" description="Agrega tu primer cliente" />
        )}
      </div>

      {/* Paginación */}
      <Pagination
        page={table.page}
        totalPages={data?.meta.totalPages}
        onPageChange={table.setPage}
        total={data?.meta.total}
      />
    </div>
  );
};
```

---

## Componente Paginación

```tsx
// components/ui/Pagination.tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, total, onPageChange }: PaginationProps) => (
  <div className="flex items-center justify-between">
    <p className="text-sm text-slate-500">
      Mostrando página {page} de {totalPages} ({total} registros)
    </p>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  </div>
);
```

---

## Estilos de Tabla

```css
/* Estilos base de tabla */
.table-container {
  @apply bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden;
}

.table-header {
  @apply bg-slate-50 dark:bg-slate-800/50;
}

.table-row {
  @apply hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors;
}

.table-cell {
  @apply px-4 py-3 text-sm;
}
```

---

## Checklist

- [ ] Usar `useTableState` hook para estado
- [ ] Incluir query keys con todos los params de tabla
- [ ] Headers ordenables con `SortableHeader`
- [ ] Barra de búsqueda con debounce
- [ ] EmptyState cuando no hay datos
- [ ] Paginación con total de registros
- [ ] Skeleton loading durante carga
