---
name: siba-logging
description: Estrategia de logging para debugging y monitoreo en producción
---

# SIBA Logging

Lineamientos para implementar logging efectivo en desarrollo y producción.

## Cuándo Usar

- Debuggear **problemas en producción**
- Monitorear **performance de API**
- Registrar **acciones de usuario**
- Auditar **cambios en datos**

---

## Niveles de Log

| Nivel   | Cuándo Usar                                | Visible en Prod |
| ------- | ------------------------------------------ | --------------- |
| `error` | Excepciones, fallos críticos               | ✅ Sí           |
| `warn`  | Situaciones anómalas pero recuperables     | ✅ Sí           |
| `info`  | Eventos importantes (login, transacciones) | ✅ Sí           |
| `debug` | Información de desarrollo                  | ❌ No           |

---

## Logger Utility

```typescript
// utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

const isDev = process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const shouldLog = (level: LogLevel): boolean => {
  return levels[level] >= levels[LOG_LEVEL as LogLevel];
};

const formatLog = (entry: LogEntry): string => {
  const { level, message, timestamp, context } = entry;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('debug')) return;
    console.debug(
      formatLog({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        context,
      })
    );
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('info')) return;
    console.info(
      formatLog({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        context,
      })
    );
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('warn')) return;
    console.warn(
      formatLog({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        context,
      })
    );
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    if (!shouldLog('error')) return;
    console.error(
      formatLog({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        context: { ...context, stack: error?.stack },
      })
    );

    // En producción: enviar a servicio de monitoreo
    // sendToSentry(error, context);
  },
};
```

---

## Logging en Controllers

```typescript
import { logger } from '../utils/logger';

export const create = async (req: Request, res: Response) => {
  const userId = getUserId(req);

  logger.info('Creando ticket', { userId, body: req.body });

  try {
    const body = createTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.create({
      data: { ...body, creadoPorId: userId },
    });

    logger.info('Ticket creado', { ticketId: ticket.id, userId });

    res.status(201).json(ticket);
  } catch (error) {
    logger.error('Error al crear ticket', error as Error, {
      userId,
      body: req.body,
    });
    res.status(500).json({ error: 'Error al crear ticket' });
  }
};
```

---

## Request Logging Middleware

```typescript
// middlewares/requestLogger.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log al iniciar request
  logger.debug(`→ ${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });

  // Log al finalizar
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`← ${req.method} ${req.path} ${res.statusCode}`, {
      duration: `${duration}ms`,
      userId: (req as any).user?.id,
    });
  });

  next();
};

// Uso en index.ts
app.use(requestLogger);
```

---

## Performance Logging

```typescript
// Para medir queries lentas
const measureQuery = async <T>(name: string, queryFn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;

  if (duration > 1000) {
    logger.warn(`Query lenta: ${name}`, { duration: `${duration}ms` });
  } else {
    logger.debug(`Query: ${name}`, { duration: `${duration}ms` });
  }

  return result;
};

// Uso
const tickets = await measureQuery('getTickets', () =>
  prisma.ticket.findMany({ where: whereClause })
);
```

---

## Audit Logging

```typescript
// Para acciones importantes que requieren auditoría
interface AuditLog {
  action: string;
  entity: string;
  entityId: number;
  userId: number;
  changes?: Record<string, { from: unknown; to: unknown }>;
  timestamp: Date;
}

export const auditLog = async (log: AuditLog) => {
  // Guardar en BD
  await prisma.auditLog.create({ data: log });

  // También loguear
  logger.info(`AUDIT: ${log.action} ${log.entity}`, {
    entityId: log.entityId,
    userId: log.userId,
    changes: log.changes,
  });
};

// Uso
await auditLog({
  action: 'UPDATE',
  entity: 'Ticket',
  entityId: ticket.id,
  userId: req.user.id,
  changes: {
    estado: { from: 'NUEVO', to: 'ASIGNADO' },
  },
  timestamp: new Date(),
});
```

---

## Frontend Logging

```typescript
// lib/clientLogger.ts
const isProduction = import.meta.env.PROD;

export const clientLogger = {
  debug: (...args: unknown[]) => {
    if (!isProduction) console.debug('[DEBUG]', ...args);
  },

  info: (...args: unknown[]) => {
    console.info('[INFO]', ...args);
  },

  error: (message: string, error?: Error) => {
    console.error('[ERROR]', message, error);

    // Enviar a servicio de monitoreo
    if (isProduction && error) {
      // sendToSentry(error, { message });
    }
  },
};
```

---

## Variables de Entorno

```bash
# .env.development
LOG_LEVEL=debug

# .env.production
LOG_LEVEL=info
```

---

## Qué Loguear

| Sí Loguear          | No Loguear                      |
| ------------------- | ------------------------------- |
| Login/logout        | Passwords                       |
| Errores con stack   | Tokens JWT                      |
| Acciones CRUD       | Datos sensibles (CUIT completo) |
| Cambios de estado   | Contenido de archivos           |
| Duración de queries | Credit cards                    |

---

## Checklist

- [ ] Logger utility con niveles
- [ ] Request logger middleware
- [ ] Logs en catch de controllers
- [ ] Audit log para acciones críticas
- [ ] LOG_LEVEL configurado por ambiente
- [ ] No loguear datos sensibles
- [ ] Performance logging para queries lentas
