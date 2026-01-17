# Sistema Bauman - Manejo de Errores

> **Versión**: 1.0

---

## 🎯 Principios

1. **Nunca fallar silenciosamente** - Siempre loggear
2. **Errores legibles para el usuario** - Mensajes claros
3. **Errores detallados para debugging** - Stack traces en logs
4. **Consistencia** - Mismo formato en toda la app

---

## 🏗️ Arquitectura de Errores

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │ Try/Catch  │→ │ Toast msg  │  │ Error Boundary (React) ││
│  └────────────┘  └────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │ Controller │→ │ Service    │→ │ Error Middleware       ││
│  └────────────┘  └────────────┘  └────────────────────────┘│
│                                           ↓                 │
│                                  ┌────────────────────────┐│
│                                  │ Logger (Winston/Pino)  ││
│                                  └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Backend: Clases de Error

### Base Error Class

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Errores Específicos

```typescript
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

---

## 🔧 Error Middleware (Express)

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // AppError conocido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: (err as any).errors,
      },
    });
    return;
  }

  // Error desconocido - no exponer detalles
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    },
  });
}
```

---

## 📝 Formato de Respuesta

### Éxito
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El email es inválido",
    "details": { "field": "email" }
  }
}
```

---

## 🎨 Frontend: Manejo de Errores

### API Client con Interceptor

```typescript
// src/lib/apiClient.ts
import axios from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || 'Error de conexión';
    
    // Mostrar toast con error
    toast.error(message);
    
    // Si es 401, redirigir a login
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
```

### Error Boundary (React)

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 📊 Logging (Winston)

```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

---

## ✅ Checklist

- [ ] Clases de error creadas
- [ ] Error middleware configurado
- [ ] Logger (Winston) configurado
- [ ] API client con interceptor
- [ ] Error Boundary en React
- [ ] Toast para errores de usuario
