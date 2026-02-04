---
name: siba-auth
description: Patrones de autenticación JWT, roles y permisos en SIBA
---

# SIBA Auth

Lineamientos para autenticación, autorización y manejo de sesiones.

## Cuándo Usar

- Implementes **login/logout**
- Manejes **tokens JWT**
- Configures **roles y permisos**
- Protejas **rutas** en frontend o backend

---

## Arquitectura de Auth

```
Frontend                          Backend
┌─────────────┐                  ┌─────────────┐
│  Login Form │ ──credentials──> │ POST /login │
│             │ <──JWT token──── │             │
│  AuthStore  │                  │  JWT Sign   │
│  (Zustand)  │                  └─────────────┘
└─────────────┘                         │
       │                                │
       │ Bearer token                   │ verify JWT
       ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│  API calls  │ ──────────────── │ Auth Middle │
│  (Axios)    │                  │ req.user    │
└─────────────┘                  └─────────────┘
```

---

## Backend: Middleware de Auth

```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para roles específicos
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !roles.includes(user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }

    next();
  };
};
```

---

## Backend: Controller de Auth

```typescript
// controllers/auth.controller.ts
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol.nombre },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
};

export const me = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nombre: true, email: true, rol: { select: { nombre: true } } },
  });

  res.json(user);
};
```

---

## Frontend: Auth Store (Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

## Frontend: Axios Interceptor

```typescript
// lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Agregar token a cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Frontend: Ruta Protegida

```tsx
// components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

// Uso en rutas
<Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
    <Route path="/admin" element={<AdminPanel />} />
</Route>
```

---

## Roles del Sistema

| Rol          | Descripción        | Permisos                   |
| ------------ | ------------------ | -------------------------- |
| `ADMIN`      | Administrador      | Todo                       |
| `SUPERVISOR` | Supervisor de área | Ver todo, editar asignados |
| `TECNICO`    | Técnico de campo   | Solo tickets asignados     |
| `CLIENTE`    | Cliente externo    | Solo consultar sus tickets |

---

## Checklist

- [ ] JWT_SECRET en .env (mínimo 32 caracteres)
- [ ] Middleware de auth en rutas protegidas
- [ ] Interceptor Axios para token
- [ ] Persistir auth en localStorage (Zustand persist)
- [ ] Manejar 401 con redirect a login
- [ ] ProtectedRoute para rutas privadas
- [ ] Hash de passwords con bcrypt (10 rounds)
