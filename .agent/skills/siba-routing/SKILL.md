---
name: siba-routing
description: Convenciones de rutas React Router y guards de navegación
---

# SIBA Routing

Lineamientos para configurar rutas y navegación en React.

## Cuándo Usar

- Configurar **estructura de rutas**
- Implementar **rutas protegidas** (auth)
- Crear **layouts anidados**
- Manejar **404 y errores**

---

## Estructura de Rutas

```
/                           → Redirect a /dashboard
/login                      → LoginPage (pública)
/dashboard                  → DashboardPage (protegida)
/tickets                    → TicketsPage (protegida)
/tickets/:id                → TicketDetailPage (protegida)
/tickets/nuevo              → TicketFormPage (protegida)
/clientes                   → ClientesPage (protegida)
/clientes/:id               → ClienteDetailPage (protegida)
/admin/*                    → AdminRoutes (solo ADMIN)
/404                        → NotFoundPage
```

---

## Configuración Base

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy loading
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

export const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
          </Route>
        </Route>

        {/* Rutas solo admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
```

---

## Protected Route

```tsx
// components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // No autenticado → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sin rol permitido → Unauthorized
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## Redirect después de Login

```tsx
// pages/LoginPage.tsx
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (data: LoginData) => {
    await login(data);
    navigate(from, { replace: true });
  };

  // ...
};
```

---

## Layouts Anidados

```tsx
// components/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <Outlet /> {/* Aquí se renderizan las rutas hijas */}
      </main>
    </div>
  </div>
);

// components/layout/AuthLayout.tsx
export const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100">
    <Outlet />
  </div>
);
```

---

## Navegación Programática

```tsx
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const TicketsPage = () => {
  const navigate = useNavigate();

  // Navegar
  const goToDetail = (id: number) => navigate(`/tickets/${id}`);

  // Navegar con state
  const goToEdit = (ticket: Ticket) => {
    navigate(`/tickets/${ticket.id}/editar`, { state: { ticket } });
  };

  // Volver atrás
  const goBack = () => navigate(-1);

  // Reemplazar historial
  const replaceRoute = () => navigate('/nuevo', { replace: true });
};

const TicketDetailPage = () => {
  // Obtener parámetros de URL
  const { id } = useParams<{ id: string }>();

  // Obtener query params
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'info';

  // Actualizar query params
  const setTab = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };
};
```

---

## Active Links

```tsx
// components/layout/NavLink.tsx
import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const NavLink = ({ to, children, icon }: NavLinkProps) => (
  <RouterNavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
        isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'
      )
    }
  >
    {icon}
    {children}
  </RouterNavLink>
);
```

---

## Error Boundary en Rutas

```tsx
// App.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<Route
    path="/tickets"
    element={
        <ErrorBoundary>
            <TicketsPage />
        </ErrorBoundary>
    }
/>

// O con errorElement de React Router 6.4+
<Route
    path="/tickets"
    element={<TicketsPage />}
    errorElement={<RouteErrorPage />}
/>
```

---

## Constantes de Rutas

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TICKETS: {
    LIST: '/tickets',
    DETAIL: (id: number | string) => `/tickets/${id}`,
    NEW: '/tickets/nuevo',
    EDIT: (id: number | string) => `/tickets/${id}/editar`,
  },
  CLIENTES: {
    LIST: '/clientes',
    DETAIL: (id: number | string) => `/clientes/${id}`,
  },
  ADMIN: {
    ROOT: '/admin',
    USERS: '/admin/usuarios',
    ROLES: '/admin/roles',
  },
} as const;

// Uso
navigate(ROUTES.TICKETS.DETAIL(123));
```

---

## Breadcrumbs

```tsx
// hooks/useBreadcrumbs.ts
import { useLocation, useParams } from 'react-router-dom';

export const useBreadcrumbs = () => {
  const location = useLocation();
  const params = useParams();

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter(Boolean);

    return pathnames.map((segment, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = getLabelForSegment(segment, params);

      return { path, label };
    });
  }, [location.pathname, params]);

  return breadcrumbs;
};
```

---

## Checklist

- [ ] Lazy loading en páginas pesadas
- [ ] ProtectedRoute para autenticación
- [ ] Roles verificados en rutas admin
- [ ] Redirect después de login al origen
- [ ] 404 page para rutas inexistentes
- [ ] Layouts con Outlet para rutas anidadas
- [ ] NavLink con estado activo
- [ ] Constantes de rutas centralizadas
