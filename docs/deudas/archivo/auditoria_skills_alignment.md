> ⚠️ **NOTA**: Este documento fue consolidado en el Project Master Document.
>
> Ver información actualizada en:
>
> - [PROJECT_MASTER.md](../../PROJECT_MASTER.md) - Vista ejecutiva y semáforo de salud
> - [PRIORIDADES_ROADMAP.md](../PRIORIDADES_ROADMAP.md) - Plan de acción con checklists
> - [seguridad-critica.md](../seguridad-critica.md) - Consolidado de vulnerabilidades críticas
>
> Este archivo se mantiene como referencia histórica detallada.

---

# 🔍 Auditoría de Código & Skills Alignment

**Proyecto**: SIBA - Sistema de Gestión de Tickets
**Fecha Auditoría**: 2026-02-04
**Auditor**: Senior Lead Developer & Security Auditor
**Alcance**: Backend (Express/Prisma), Frontend (React/Zustand), Skills Documentation

---

## Semáforo de Estado General

| Área               | Estado      | Justificación                                              |
| ------------------ | ----------- | ---------------------------------------------------------- |
| **Seguridad**      | 🟡 AMARILLO | JWT fallback inseguro, rutas sin auth, falta rate limiting |
| **Escalabilidad**  | 🟢 VERDE    | Arquitectura sólida, TanStack Query bien configurado       |
| **Mantenibilidad** | 🟡 AMARILLO | Algunos controllers violan SRP (>500 líneas)               |

---

## 1. Auditoría de Skills Alignment

### 1.1 Alineación Backend vs Skills Documentadas

| Skill                 | Documentación                           | Implementación Real                      | Alineación |
| --------------------- | --------------------------------------- | ---------------------------------------- | ---------- |
| `siba-api-patterns`   | Zod validation, soft delete, paginación | ✅ Implementado en todos los controllers | ✅ 100%    |
| `siba-auth`           | JWT + httpOnly cookies, refresh tokens  | ✅ Implementado correctamente            | ✅ 95%     |
| `siba-security`       | Helmet, CORS, rate limiting             | ⚠️ Rate limiting NO implementado         | ❌ 60%     |
| `siba-error-handling` | Error handler middleware                | ⚠️ Muy básico, sin clasificación         | ⚠️ 70%     |
| `siba-prisma`         | Soft delete, transacciones              | ✅ Implementado correctamente            | ✅ 100%    |

### 1.2 Hallazgo Crítico: Rutas Sin Autenticación

```diff
// ticket.routes.ts - ACTUAL (INSEGURO)
const router = Router();
- router.get('/', ticketController.getAll);
- router.post('/', ticketController.create);

// CORRECCIÓN REQUERIDA
+ import { authenticateToken } from '../middlewares/auth.middleware.js';
+ router.use(authenticateToken);  // PROTEGER TODAS
+ router.get('/', ticketController.getAll);
+ router.post('/', ticketController.create);
```

**Impacto**: Cualquier usuario sin autenticar puede acceder a TODOS los tickets.

**Rutas Afectadas**:

- `/api/tickets` - ❌ SIN AUTH
- `/api/upload` - ❌ SIN AUTH
- `/api/empleados` - ⚠️ Verificar
- `/api/sedes` - ⚠️ Verificar
- `/api/zones` - ⚠️ Verificar
- `/api/vehiculos` - ⚠️ Verificar
- `/api/materials` - ⚠️ Verificar

**Ruta Correcta (Ejemplo finanzas.routes.ts)**:

```typescript
// ✅ CORRECTO - Ejemplo a seguir
router.use(authenticateToken);
router.get('/dashboard', requirePermission('finanzas:leer'), controller.getDashboard);
```

---

## 2. Hallazgos de Seguridad Crítica

### 2.1 🔴 JWT Secret con Fallback Inseguro

**Archivo**: [auth.middleware.ts](file:///c:/repo/siba/apps/api/src/middlewares/auth.middleware.ts#L4)

```typescript
// ❌ ACTUAL - CRÍTICO
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

**Impacto**: Si la variable de entorno no está configurada, cualquier atacante puede generar tokens válidos.

**Solución**:

```typescript
// ✅ CORRECCIÓN
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be set and at least 32 characters');
}
```

**Archivos Afectados**:

- `auth.middleware.ts` línea 4
- `auth.service.ts` líneas 6-7

---

### 2.2 🟡 Bcrypt Rounds Insuficientes

**Archivo**: [auth.service.ts](file:///c:/repo/siba/apps/api/src/services/auth.service.ts#L25-L27)

```typescript
// ⚠️ ACTUAL
return await bcrypt.hash(pass, 10);

// ✅ RECOMENDADO (según skill siba-security)
const SALT_ROUNDS = 12; // Mínimo 10, recomendado 12
return await bcrypt.hash(pass, SALT_ROUNDS);
```

---

### 2.3 🔴 Rate Limiting No Implementado

**Skill `siba-security` documenta**:

```typescript
// Lo que DEBERÍA existir según la skill
app.use('/api', generalLimiter);
app.use('/api/auth/login', loginLimiter);
```

**Realidad en `index.ts`**: No existe ningún rate limiter.

**Solución Inmediata**:

```typescript
// apps/api/src/index.ts - AÑADIR
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de login' },
  skipSuccessfulRequests: true,
});

app.use('/api', generalLimiter);
// En auth.routes.ts:
router.post('/login', loginLimiter, login);
```

---

### 2.4 🟡 Upload sin Validación de Magic Bytes

**Archivo**: [upload.routes.ts](file:///c:/repo/siba/apps/api/src/routes/upload.routes.ts#L15-L32)

```typescript
// ⚠️ ACTUAL - Solo valida MIME type (puede ser falsificado)
fileFilter: (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  }
};
```

**Solución según skill `siba-security`**:

```typescript
import fileType from 'file-type';

// Validar por magic bytes después de recibir
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  // ✅ Validar magic bytes
  const type = await fileType.fromBuffer(req.file.buffer);
  if (!type || !allowedMimes.includes(type.mime)) {
    return res.status(400).json({ error: 'Tipo de archivo no válido' });
  }

  // Continuar con upload...
});
```

---

## 3. Hallazgos de Escalabilidad y Performance

### 3.1 🟢 Estado Frontend: Bien Estructurado

| Patrón                        | Estado      | Ubicación                          |
| ----------------------------- | ----------- | ---------------------------------- |
| Server State (TanStack Query) | ✅ Correcto | Usado en todas las pages           |
| Client State (Zustand)        | ✅ Correcto | Solo auth, sin persistir token     |
| Token en memoria              | ✅ Correcto | `partialize` excluye `accessToken` |
| Auto-refresh tokens           | ✅ Correcto | Interceptor en `api.ts`            |

### 3.2 🟡 Error Handler Backend Muy Básico

**Archivo**: [index.ts](file:///c:/repo/siba/apps/api/src/index.ts#L109-L115)

```typescript
// ❌ ACTUAL - Muy genérico
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});
```

**Según skill `siba-error-handling`, debería ser**:

```typescript
// ✅ CORRECCIÓN - Error handler completo
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Errores de Zod
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

  res.status(500).json({
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
```

---

## 4. Buenas Prácticas y SRP Violations

### 4.1 🟡 Controllers Demasiado Grandes

| Controller                  | Líneas | Estado                   |
| --------------------------- | ------ | ------------------------ |
| `finanzas.controller.ts`    | 533    | 🔴 Viola SRP severamente |
| `ticket.controller.ts`      | 483    | 🟡 En el límite          |
| `obra.controller.ts`        | ~400+  | 🟡 Revisar               |
| `presupuesto.controller.ts` | ~400+  | 🟡 Revisar               |

**Refactorización Sugerida para finanzas.controller.ts**:

```
apps/api/src/controllers/finanzas/
├── index.ts                    # Re-exporta todo
├── banco.controller.ts         # getBancos, createBanco, updateBanco
├── cuenta.controller.ts        # CRUD de cuentas
├── movimiento.controller.ts    # CRUD de movimientos
├── dashboard.controller.ts     # getDashboard, getSaldos
└── schemas/
    └── finanzas.schemas.ts     # Todos los Zod schemas
```

**Implementación de split**:

```typescript
// finanzas/banco.controller.ts
import { Request, Response } from 'express';
import { createBancoSchema } from './schemas/finanzas.schemas.js';
import { prisma } from '../../lib/prisma.js';

export const getBancos = async (_req: Request, res: Response) => { ... };
export const createBanco = async (req: Request, res: Response) => { ... };
export const updateBanco = async (req: Request, res: Response) => { ... };

// finanzas/index.ts
export * from './banco.controller.js';
export * from './cuenta.controller.js';
export * from './movimiento.controller.js';
export * from './dashboard.controller.js';
```

---

### 4.2 🟢 Estructura de Carpetas Frontend: Correcta

```
apps/web/src/
├── components/     # Componentes reutilizables
├── features/       # Módulos por feature (finanzas, tickets, etc.)
├── hooks/          # Custom hooks
├── lib/            # API client, utils
├── pages/          # Páginas principales
├── stores/         # Zustand stores
└── types/          # TypeScript types
```

**Recomendación**: Mover componentes específicos de features a sus carpetas:

```diff
- pages/TicketsPage.tsx (16KB)
+ features/tickets/
+   ├── TicketsPage.tsx
+   ├── TicketDrawer.tsx
+   ├── TicketFilters.tsx
+   └── hooks/useTickets.ts
```

---

## 5. Checklist de Robustez Inmediata

### 🔴 Crítico (Hacer HOY)

- [ ] **Eliminar fallback de JWT_SECRET** en `auth.middleware.ts` y `auth.service.ts`
- [ ] **Agregar `authenticateToken`** a TODAS las rutas excepto `/auth/login` y `/auth/refresh`
- [ ] **Instalar y configurar `express-rate-limit`** en `index.ts`
- [ ] **Agregar rate limiting estricto** a ruta de login (5 intentos/15min)

### 🟡 Importante (Esta Semana)

- [ ] Aumentar bcrypt rounds de 10 a 12
- [ ] Implementar validación de magic bytes en uploads
- [ ] Mejorar error handler global con clasificación de errores
- [ ] Agregar validación de `JWT_SECRET.length >= 32` al startup

### 🟢 Mejoras (Próximo Sprint)

- [ ] Dividir `finanzas.controller.ts` en sub-controllers
- [ ] Reorganizar pages grandes a features
- [ ] Implementar logging estructurado (request ID, timestamps)
- [ ] Agregar OpenTelemetry para observabilidad

---

## 6. Snippets de Corrección Rápida

### Proteger Todas las Rutas de Tickets

```typescript
// apps/api/src/routes/ticket.routes.ts
import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// ✅ PROTEGER TODAS LAS RUTAS
router.use(authenticateToken);

router.get('/', requirePermission('tickets:leer'), ticketController.getAll);
router.get('/:id', requirePermission('tickets:leer'), ticketController.getById);
router.post('/', requirePermission('tickets:crear'), ticketController.create);
router.put('/:id', requirePermission('tickets:editar'), ticketController.update);
router.patch('/:id/estado', requirePermission('tickets:editar'), ticketController.cambiarEstado);
router.delete('/:id', requirePermission('tickets:eliminar'), ticketController.deleteOne);

export default router;
```

### Proteger Rutas de Upload

```typescript
// apps/api/src/routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middlewares/auth.middleware.js';
// ... resto de imports

const router = Router();

// ✅ PROTEGER
router.use(authenticateToken);

router.post('/', upload.single('file'), async (req, res) => { ... });
router.delete('/:id', async (req, res) => { ... });

export default router;
```

### Validar Variables de Entorno al Startup

```typescript
// apps/api/src/index.ts - Añadir al inicio
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ CRITICAL: Missing required env var: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET!.length < 32) {
  console.error('❌ CRITICAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

console.log('✅ Environment validation passed');
```

---

## Resumen Ejecutivo

| Hallazgo                | Severidad  | Esfuerzo Fix |
| ----------------------- | ---------- | ------------ |
| Rutas sin autenticación | 🔴 Crítica | 30 min       |
| JWT fallback inseguro   | 🔴 Crítica | 15 min       |
| Sin rate limiting       | 🔴 Alta    | 1 hora       |
| bcrypt rounds bajos     | 🟡 Media   | 5 min        |
| Error handler básico    | 🟡 Media   | 1 hora       |
| Controllers muy grandes | 🟡 Media   | 4 horas      |
| Uploads sin magic bytes | 🟡 Media   | 30 min       |

**Tiempo estimado para fixes críticos**: ~2 horas  
**Tiempo estimado para mejoras importantes**: ~6 horas

---

> [!CAUTION]
> **Las rutas de tickets y uploads están COMPLETAMENTE ABIERTAS sin autenticación.** Esto es una vulnerabilidad crítica que debe corregirse inmediatamente antes de cualquier deployment a producción.

---

## 7. Auditoría UX/UI y Componentes

### 7.1 Análisis de Seguridad en Login - Credenciales

**Tu preocupación**: ¿Se ven las credenciales en modo desarrollador?

**Hallazgo**: El campo password usa `type="password"` correctamente, pero hay un problema:

```typescript
// LoginPage.tsx línea 31 - ⚠️ EXPOSICIÓN EN CONSOLE
} catch (err: unknown) {
  console.error('Login failed', err);  // El error puede contener datos sensibles
```

**En DevTools Network**:

- Las credenciales se envían en el **body** del POST (no en URL) ✅
- Sin embargo, son visibles en la pestaña **Network > Payload** - esto es **normal y esperado**
- El password viaja encriptado si usás HTTPS ✅

**Lo que SÍ es un problema**:

```diff
// ❌ ACTUAL - Puede loguear stack traces con info sensible
- console.error('Login failed', err);

// ✅ CORRECCIÓN
+ if (import.meta.env.DEV) {
+   console.error('Login failed', err);
+ }
+ // En producción, solo loguear a servicio de monitoreo
```

### 7.2 Reutilización de Componentes - Diagnóstico

| Componente   | Ubicación | Estado       | Recomendación                  |
| ------------ | --------- | ------------ | ------------------------------ |
| `Button`     | ui/core   | ✅ Excelente | Bien implementado con variants |
| `Input`      | ui/core   | ✅ Bueno     | Falta `aria-*` attributes      |
| `DialogBase` | ui/core   | ✅ Excelente | Composición correcta           |
| `Select`     | ui/core   | ✅ Bueno     | Basado en Radix                |
| `Combobox`   | ui/core   | ✅ Bueno     | Búsqueda + select              |
| `DatePicker` | ui/core   | ⚠️ Grande    | 9KB - considerar lazy load     |
| `Sheet`      | ui/       | ✅ Bueno     | Panel lateral estilo drawer    |
| `EmptyState` | ui/       | ✅ Útil      | Estados vacíos                 |

**Componentes que FALTAN según skills**:

```tsx
// ui/core/ debería tener también:
-Textarea.tsx - // Campo de texto multilínea
  Checkbox.tsx - // Checkbox estilizado
  Radio.tsx - // Radio buttons
  Switch.tsx - // Toggle switch
  Badge.tsx - // Etiquetas de estado
  Skeleton.tsx - // Loading placeholders
  Avatar.tsx; // Avatares de usuario
```

### 7.3 LoginPage vs Skills de Forms

**Problema detectado**: LoginPage NO usa el patrón estándar de forms.

```tsx
// ❌ ACTUAL - LoginPage usa useState directo
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// ✅ Según skill siba-forms debería usar RHF + Zod
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
});
```

**Refactorización sugerida**:

```tsx
// LoginPage.tsx - versión mejorada
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/core/Input';
import { Button } from '@/components/ui/core/Button';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post('/auth/login', data);
      // ...
    } catch (err) {
      // ...
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      <Input
        label="Contraseña"
        type="password"
        {...register('password')}
        error={errors.password?.message}
      />
      <Button type="submit" isLoading={isSubmitting}>
        Iniciar Sesión
      </Button>
    </form>
  );
}
```

### 7.4 Accesibilidad (a11y) - Hallazgos

| Elemento           | Estado      | Problema                                          |
| ------------------ | ----------- | ------------------------------------------------- |
| Labels en forms    | ⚠️ Parcial  | LoginPage no asocia labels con `htmlFor`          |
| Focus visible      | ✅ Bueno    | Implementado en components                        |
| aria-\* attributes | ⚠️ Faltante | Input no tiene `aria-invalid`, `aria-describedby` |
| Contraste          | ✅ Bueno    | Paleta bien definida                              |
| Screen reader      | ⚠️ Faltante | Falta `aria-live` para errores dinámicos          |

**Fix para Input.tsx**:

```diff
// Input.tsx - Mejorar accesibilidad
<input
  id={id}
  ref={ref}
+ aria-invalid={!!error}
+ aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
  className={cn(...)}
  {...props}
/>
{error && (
- <p className="text-[11px] font-medium text-red-500 mt-1">{error}</p>
+ <p id={`${id}-error`} role="alert" className="text-[11px] font-medium text-red-500 mt-1">{error}</p>
)}
```

### 7.5 Responsive - Análisis LoginPage

| Aspecto       | Estado   | Observación                     |
| ------------- | -------- | ------------------------------- |
| Mobile-first  | ✅ Sí    | `flex flex-col` como base       |
| Breakpoints   | ✅ Bien  | `sm:p-8`, gradientes responsive |
| Touch targets | ✅ 40px+ | Botones altura 40px             |
| Max-width     | ✅ 400px | Contenido limitado              |

**Mejora sugerida**: Agregar responsive al tamaño de logo:

```diff
<img
  src={logoBauman}
  alt="Bauman"
- className="h-16 w-auto object-contain"
+ className="h-12 sm:h-16 w-auto object-contain"
/>
```

---

## 8. Checklist UX/UI

### Seguridad Visual

- [ ] Remover `console.error` con objetos de error en producción
- [ ] Agregar autocomplete="current-password" al input de password
- [ ] Considerar agregar CAPTCHA después de 3 intentos fallidos

### Reutilización de Componentes

- [ ] Refactorizar LoginPage para usar `Input` de ui/core
- [ ] Crear componentes faltantes: `Textarea`, `Checkbox`, `Badge`, `Skeleton`
- [ ] Lazy load de `DatePicker` (9KB)

### Accesibilidad

- [ ] Agregar `aria-invalid` y `aria-describedby` al Input
- [ ] Agregar `role="alert"` a mensajes de error
- [ ] Asociar labels con `htmlFor` en LoginPage
- [ ] Agregar `aria-live="polite"` para notificaciones dinámicas

### Consistencia

- [ ] Migrar LoginPage a patrón RHF + Zod
- [ ] Usar `Button` component en LoginPage en lugar de button nativo
- [ ] Estandarizar espaciado con clases de diseño (`space-y-4`)
