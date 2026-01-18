---
name: frontend-dev-guidelines
description: Frontend development guidelines for React/TypeScript applications with Vite, shadcn/ui, and Tailwind CSS. Modern patterns including Suspense, lazy loading, React Query, file organization with features directory, and TypeScript best practices. Use when creating components, pages, features, fetching data, styling, routing, or working with frontend code in SIBA.
---

# Frontend Development Guidelines - SIBA

## Purpose

Comprehensive guide for React development in SIBA project, using Vite, shadcn/ui, Tailwind CSS, and React Router DOM.

## Stack Reference

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI Framework |
| Vite | 7.x | Build tool |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | Latest | Component library |
| React Router DOM | 7.x | Client-side routing |
| Zustand | 5.x | State management |
| Axios | 1.x | HTTP client |
| Lucide React | Latest | Icons |

---

## Quick Start

### New Component Checklist

- [ ] Use `React.FC<Props>` pattern with TypeScript
- [ ] Lazy load if heavy component: `React.lazy(() => import())`
- [ ] Wrap in `<Suspense>` for loading states
- [ ] Use Tailwind classes for styling (never inline styles)
- [ ] Support both light and dark mode with `dark:` prefix
- [ ] Responsive: Mobile-first or desktop-first with breakpoints
- [ ] Use Lucide React icons, NEVER emojis
- [ ] Default export at bottom

### New Feature Checklist

- [ ] Create `features/{feature-name}/` directory
- [ ] Create subdirectories: `api/`, `components/`, `hooks/`, `types/`
- [ ] Create API service file: `api/{feature}Api.ts`
- [ ] Set up TypeScript types in `types/`
- [ ] Create route in React Router
- [ ] Lazy load feature components
- [ ] Export public API from feature `index.ts`

---

## File Structure

```
src/
├── components/           # Componentes reutilizables
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   └── common/          # Otros comunes
│
├── features/             # Módulos por dominio
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── clientes/
│   ├── tickets/
│   └── obras/
│
├── hooks/                # Hooks globales
├── lib/                  # Utilidades (apiClient, cn, etc.)
├── routes/               # Definición de rutas
└── types/                # Tipos globales
```

---

## Common Imports

```typescript
// React & Lazy Loading
import React, { useState, useCallback, useMemo, Suspense } from 'react';
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// shadcn/ui Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Icons (Lucide React)
import { Menu, X, ChevronDown, User } from 'lucide-react';

// Routing
import { useNavigate, useParams, Link } from 'react-router-dom';

// State Management
import { useAuthStore } from '@/stores/authStore';

// API Client
import { apiClient } from '@/lib/apiClient';

// Utilities
import { cn } from '@/lib/utils';
```

---

## Styling with Tailwind CSS

### NEVER use inline styles or CSS-in-JS

```typescript
// ❌ NEVER
<div style={{ padding: '16px', backgroundColor: 'white' }}>

// ❌ NEVER (MUI style)
<Box sx={{ p: 2, bgcolor: 'background.paper' }}>

// ✅ ALWAYS
<div className="p-4 bg-white dark:bg-charcoal">
```

### Dark Mode Pattern

```typescript
// Always include dark: variants
<div className="bg-white dark:bg-[#1a1c1e] text-slate-900 dark:text-white">
  <p className="text-slate-500 dark:text-slate-400">Secondary text</p>
</div>
```

### Color Tokens (from bauman-design-system)

| Token | Light | Dark |
|-------|-------|------|
| Background | `bg-[#f8f8f7]` | `dark:bg-[#121416]` |
| Surface | `bg-white` | `dark:bg-[#1a1c1e]` |
| Border | `border-[#e5e5e3]` | `dark:border-[#37322a]` |
| Primary | `bg-gold` | Same |
| Text | `text-slate-900` | `dark:text-white` |
| Muted | `text-slate-500` | `dark:text-slate-400` |

### Gold Accent (CTA & Active States)

```typescript
// Primary Button
<Button className="bg-gold hover:bg-gold-light text-white">
  Guardar
</Button>

// Active sidebar item
<div className="bg-gold/10 text-gold border-l-2 border-gold">
  Dashboard
</div>
```

---

## Component Patterns

### Basic Component

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface ClienteCardProps {
  nombre: string;
  email: string;
  onEdit?: () => void;
}

export const ClienteCard: React.FC<ClienteCardProps> = ({ 
  nombre, 
  email, 
  onEdit 
}) => {
  return (
    <Card className="bg-white dark:bg-charcoal/30 border-[#e5e5e3] dark:border-[#37322a]">
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {nombre}
        </h3>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500 dark:text-slate-400">{email}</p>
        {onEdit && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onEdit}
          >
            Editar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClienteCard;
```

### Lazy Loading

```typescript
import React, { Suspense } from 'react';

const DataTable = React.lazy(() => import('./DataTable'));

export const ClientesPage: React.FC = () => {
  return (
    <div className="p-6">
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
};
```

---

## Responsive Breakpoints

```
Mobile:   < 768px   (default, no prefix)
Tablet:   md: 768px
Desktop:  lg: 1024px
Wide:     xl: 1280px
```

### Layout Examples

```typescript
// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar visibility
<aside className="hidden lg:flex w-[260px]">

// Mobile menu
<Sheet>
  <SheetTrigger className="lg:hidden">
    <Menu className="h-6 w-6" />
  </SheetTrigger>
  <SheetContent side="left">
    {/* Mobile nav */}
  </SheetContent>
</Sheet>
```

---

## Data Fetching

### API Service Layer

```typescript
// features/clientes/api/clientesApi.ts
import { apiClient } from '@/lib/apiClient';
import type { Cliente, CreateClienteDto } from '../types';

export const clientesApi = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await apiClient.get('/clientes');
    return response.data;
  },
  
  getById: async (id: number): Promise<Cliente> => {
    const response = await apiClient.get(`/clientes/${id}`);
    return response.data;
  },
  
  create: async (data: CreateClienteDto): Promise<Cliente> => {
    const response = await apiClient.post('/clientes', data);
    return response.data;
  },
};
```

### Using in Components

```typescript
import { useState, useEffect } from 'react';
import { clientesApi } from '../api/clientesApi';

export const ClientesList: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await clientesApi.getAll();
        setClientes(data);
      } catch (err) {
        setError('Error al cargar clientes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="grid gap-4">
      {clientes.map(cliente => (
        <ClienteCard key={cliente.id} {...cliente} />
      ))}
    </div>
  );
};
```

---

## State Management (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

---

## Anti-Patterns to Avoid

| ❌ Never | ✅ Always |
|----------|-----------|
| MUI components | shadcn/ui components |
| `sx` prop | Tailwind classes |
| `styled()` | `className` |
| Emojis | Lucide React icons |
| Hardcoded colors | Tailwind tokens |
| Missing `dark:` | Both modes |
| TanStack Router | React Router DOM |

---

## Related Skills

- **bauman-design-system** - Visual design tokens and components
- **backend-dev-guidelines** - API patterns the frontend consumes
- **testing-patterns** - Jest/Vitest testing strategies

---

**Skill Status**: UPDATED for SIBA Stack ✅