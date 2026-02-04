---
name: siba-error-handling
description: Patrones para manejo de errores en frontend y backend
---

# SIBA Error Handling

Lineamientos para manejar errores de forma consistente y user-friendly.

## Cuándo Usar

- Implementar **try/catch** en controllers
- Crear **mensajes de error** amigables
- Configurar **Error Boundaries** en React
- Loguear errores para **debugging**

---

## Backend: Estructura de Errores

### Respuesta de Error Estándar

```typescript
// Siempre usar esta estructura
interface ErrorResponse {
  error: string; // Mensaje para mostrar al usuario
  code?: string; // Código interno (opcional)
  details?: unknown; // Detalles técnicos (solo en dev)
}

// Ejemplos
res.status(400).json({ error: 'El email ya está registrado' });
res.status(404).json({ error: 'Ticket no encontrado' });
res.status(500).json({ error: 'Error interno del servidor' });
```

### Error Handler Middleware

```typescript
// middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Errores de Zod (validación)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: process.env.NODE_ENV === 'development' ? err : undefined,
    });
  }

  // Errores de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;

    if (prismaErr.code === 'P2002') {
      return res.status(400).json({ error: 'El registro ya existe' });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// Uso en index.ts (al final, después de las rutas)
app.use(errorHandler);
```

---

## Backend: Patrón Try/Catch

```typescript
// ✅ CORRECTO - Mensajes específicos
export const getById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const ticket = await prisma.ticket.findFirst({
            where: { id, fechaEliminacion: null },
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(500).json({ error: 'Error al obtener el ticket' });
    }
};

// ❌ EVITAR - Mensaje genérico
} catch (error) {
    res.status(500).json({ error: 'Error' }); // No informativo
}
```

---

## Frontend: Error Boundary

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/core/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Aquí podrías enviar a Sentry/LogRocket
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
              <p className="text-slate-500 mb-4">Hubo un error al cargar esta sección</p>
              <Button onClick={this.handleRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
                Reintentar
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Uso
<ErrorBoundary>
  <TicketsPage />
</ErrorBoundary>;
```

---

## Frontend: Hook para Errores de API

```typescript
// hooks/useApiError.ts
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export const useApiError = () => {
  const handleError = (error: unknown, defaultMessage = 'Ocurrió un error') => {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.error || defaultMessage;
      toast.error(message);
      return message;
    }

    if (error instanceof Error) {
      toast.error(error.message);
      return error.message;
    }

    toast.error(defaultMessage);
    return defaultMessage;
  };

  return { handleError };
};

// Uso
const { handleError } = useApiError();

try {
  await api.post('/tickets', data);
} catch (error) {
  handleError(error, 'Error al crear el ticket');
}
```

---

## TanStack Query: Error Handling

```tsx
// Configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = (error as AxiosError)?.response?.data?.error || 'Error en la operación';
        toast.error(message);
      },
    },
  },
});

// Por query individual
const { data, error, isError } = useQuery({
  queryKey: ['tickets'],
  queryFn: fetchTickets,
});

if (isError) {
  return <ErrorMessage message={error.message} />;
}
```

---

## Mensajes de Error por Código HTTP

| Código | Mensaje Usuario                           |
| ------ | ----------------------------------------- |
| 400    | Datos inválidos / El campo X es requerido |
| 401    | Sesión expirada, por favor inicie sesión  |
| 403    | No tiene permisos para esta acción        |
| 404    | [Entidad] no encontrado/a                 |
| 409    | El registro ya existe                     |
| 422    | No se puede procesar la solicitud         |
| 500    | Error del servidor, intente más tarde     |

---

## Logger Utility

```typescript
// utils/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || '');
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    // En producción: enviar a servicio de monitoreo
  },

  debug: (message: string, data?: unknown) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },
};
```

---

## Checklist

- [ ] Error handler middleware configurado
- [ ] Try/catch en todos los controllers
- [ ] Mensajes de error descriptivos (no genéricos)
- [ ] Error Boundary en componentes principales
- [ ] Toast de error en catch de mutaciones
- [ ] Logger para debugging
- [ ] No exponer stack traces en producción
