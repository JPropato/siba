# Roadmap de Resolución de Deudas Técnicas - SIBA

> Plan detallado con checklists por fase, snippets de código y tiempos estimados.

**Última actualización**: 2026-02-04

---

## 📊 Resumen del Roadmap

| Fase       | Objetivo                   | Duración    | Esfuerzo | Estado       |
| ---------- | -------------------------- | ----------- | -------- | ------------ |
| **Fase 1** | Seguridad crítica          | 1-2 días    | 2h       | ⏳ Pendiente |
| **Fase 2** | UX/Performance importante  | 1-2 semanas | 40h      | ⏳ Pendiente |
| **Fase 3** | Arquitectura/Escalabilidad | 2-3 meses   | 80h      | ⏳ Pendiente |
| **TOTAL**  | Deuda técnica completa     | ~3 meses    | ~122h    | -            |

---

## 🔴 Fase 1: Seguridad Crítica (Sprint 0 - BLOQUEANTE)

**Objetivo**: Cerrar vulnerabilidades antes de producción
**Duración estimada**: 1-2 días
**Esfuerzo**: 2 horas de desarrollo
**Responsable**: Backend Lead
**Prioridad**: P0 - Bloqueante para deployment

### 📋 Checklist

#### [ ] SEC-001: Eliminar JWT_SECRET fallback inseguro (15 min)

**Archivos afectados**:

- `apps/api/src/middlewares/auth.middleware.ts` (línea 4)
- `apps/api/src/services/auth.service.ts` (líneas 6-7)

**Problema**:

```typescript
// ❌ VULNERABLE
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

**Solución**:

```typescript
// ✅ SEGURO
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'CRITICAL SECURITY ERROR: JWT_SECRET must be set in environment variables and be at least 32 characters long'
  );
}

export { JWT_SECRET };
```

**Testing**:

```bash
# Test 1: Sin JWT_SECRET debe fallar al iniciar
unset JWT_SECRET
npm run start:dev
# Esperado: Error "CRITICAL SECURITY ERROR..."

# Test 2: Con JWT_SECRET corto debe fallar
export JWT_SECRET="short"
npm run start:dev
# Esperado: Error "at least 32 characters"

# Test 3: Con JWT_SECRET válido debe iniciar OK
export JWT_SECRET=$(openssl rand -base64 32)
npm run start:dev
# Esperado: Server started on port 3003
```

---

#### [ ] SEC-002: Proteger rutas sin autenticación (30 min)

**Archivos afectados**:

- `apps/api/src/routes/ticket.routes.ts`
- `apps/api/src/routes/upload.routes.ts`
- Verificar: `empleado.routes.ts`, `sedes.routes.ts`, `zones.routes.ts`, `vehiculos.routes.ts`, `materials.routes.ts`

**Problema**:

```typescript
// ❌ VULNERABLE - Rutas públicas sin auth
router.get('/tickets', ticketController.getAll);
router.post('/tickets', ticketController.create);
```

**Solución**:

```typescript
// ✅ SEGURO - Todas las rutas protegidas
import { authenticateToken } from '../middlewares/auth.middleware';

// Aplicar a TODAS las rutas
router.use(authenticateToken);

// O aplicar selectivamente
router.get('/tickets', authenticateToken, ticketController.getAll);
router.post('/tickets', authenticateToken, ticketController.create);
router.put('/tickets/:id', authenticateToken, ticketController.update);
router.delete('/tickets/:id', authenticateToken, ticketController.delete);
```

**Testing**:

```bash
# Test 1: Sin token debe retornar 401
curl http://localhost:3003/api/tickets
# Esperado: {"error": "Access token required"}

# Test 2: Con token inválido debe retornar 403
curl -H "Authorization: Bearer invalid-token" http://localhost:3003/api/tickets
# Esperado: {"error": "Invalid token"}

# Test 3: Con token válido debe retornar datos
TOKEN="<token-válido>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/tickets
# Esperado: { "data": [...], "total": 10 }
```

---

#### [ ] SEC-003: Implementar rate limiting (1 hora)

**Archivo afectado**: `apps/api/src/index.ts`

**Dependencias**:

```bash
npm install express-rate-limit --workspace=@siba/api
```

**Solución**:

```typescript
// En apps/api/src/index.ts
import rateLimit from 'express-rate-limit';

// Rate limiter global (aplica a todas las rutas)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP
  message: {
    error: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde',
  },
  standardHeaders: true, // Retorna info de rate limit en headers
  legacyHeaders: false,
});

// Rate limiter estricto para login (evita brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login
  skipSuccessfulRequests: true, // No cuenta logins exitosos
  message: {
    error: 'Demasiados intentos de login fallidos. Intente de nuevo en 15 minutos',
  },
});

// Aplicar limiters
app.use('/api/', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// Resto de middlewares...
app.use(cors(corsOptions));
app.use(express.json());
```

**Testing**:

```bash
# Test 1: Hacer 6 requests rápidos a login debe bloquear el 6to
for i in {1..6}; do
  curl -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep "HTTP"
done
# Esperado: Primeros 5 retornan 401, el 6to retorna 429 Too Many Requests

# Test 2: Headers de rate limit deben estar presentes
curl -I http://localhost:3003/api/tickets
# Esperado: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
```

---

#### [ ] SEC-004: Validar JWT_SECRET al startup (10 min)

**Archivo afectado**: `apps/api/src/index.ts`

**Solución**:

```typescript
// Al inicio del archivo index.ts, ANTES de importar cualquier cosa
import dotenv from 'dotenv';
dotenv.config();

// Validación de variables de entorno críticas
function validateEnvironment() {
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  // Validar longitud de JWT_SECRET
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('❌ CRITICAL: JWT_SECRET must be at least 32 characters');
    console.error(`   Current length: ${process.env.JWT_SECRET!.length}`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}

// Ejecutar validación ANTES de iniciar el server
validateEnvironment();

// Resto del código...
const app = express();
```

**Testing**:

```bash
# Test: Iniciar con JWT_SECRET corto
JWT_SECRET="corto" npm run start:dev
# Esperado: Process exit con error message
```

---

#### [ ] SEC-005: Aumentar bcrypt rounds a 12 (5 min)

**Archivo afectado**: `apps/api/src/services/auth.service.ts` (o donde se hash la contraseña)

**Problema**:

```typescript
// ❌ INSUFICIENTE
const hashedPassword = await bcrypt.hash(password, 10);
```

**Solución**:

```typescript
// ✅ SEGURO
const BCRYPT_ROUNDS = 12; // Mejor práctica 2026
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

**Testing**:

```bash
# Test manual: Crear usuario y verificar tiempo de hash
# El hash con 12 rounds debe tomar ~100-200ms (vs 50ms con 10 rounds)
time curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123!"}'
```

---

### 🎯 Resumen Fase 1

**Total de tasks**: 5
**Esfuerzo total**: ~2 horas
**Impacto**: Crítico - Bloquea deployment a producción

**Checklist de Validación**:

- [ ] Todas las 5 tareas completadas
- [ ] Tests de cada tarea ejecutados y pasando
- [ ] Code review por Tech Lead
- [ ] Documentación de .env.example actualizada
- [ ] CI/CD incluye validación de JWT_SECRET

---

## 🟡 Fase 2: UX/Performance Importante (Sprint 1-2)

**Objetivo**: UX competitiva y accesible
**Duración estimada**: 1-2 semanas
**Esfuerzo**: 40 horas
**Responsable**: Frontend Lead
**Prioridad**: P1 - Importante para competitividad

### 🚀 Quick Wins (< 1 hora cada uno)

#### [ ] UX-010: Skeleton loaders (20 min)

**Crear**: `apps/web/src/components/ui/Skeleton.tsx`

```tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

// Skeleton variants
export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

**Usar en páginas**:

```tsx
// Reemplazar spinners genéricos
{
  isLoading ? <SkeletonTable /> : <DataTable data={data} />;
}
```

---

#### [ ] UX-011: ConfirmDialog component (30 min)

**Crear**: `apps/web/src/components/ui/ConfirmDialog.tsx`

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Reemplazar**:

```tsx
// ❌ ANTES
if (window.confirm('¿Eliminar ticket?')) {
  await deleteTicket(id);
}

// ✅ DESPUÉS
const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Eliminar ticket"
  description="Esta acción no se puede deshacer."
  onConfirm={async () => {
    await deleteTicket(id);
    setConfirmOpen(false);
  }}
  variant="destructive"
/>;
```

---

#### [ ] A11Y-001: aria-invalid en Input (20 min)

**Editar**: `apps/web/src/components/ui/core/Input.tsx`

```tsx
// Agregar props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random()}`;
    const errorId = `${inputId}-error`;

    return (
      <div>
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input...',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

---

#### [ ] MF-001: Padding responsivo en TopHeader (10 min)

**Editar**: `apps/web/src/components/layout/TopHeader.tsx`

```tsx
// ❌ ANTES
<header className="px-8 py-4">

// ✅ DESPUÉS - Responsive padding
<header className="px-4 py-3 md:px-6 md:py-4 lg:px-8">
```

---

### 📱 Mobile-First Improvements

#### [ ] MF-002: FAB para acción principal en móvil (2 horas)

**Crear**: `apps/web/src/components/layout/FloatingActionButton.tsx`

```tsx
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FABProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({ onClick, label, icon, className }: FABProps) {
  return (
    <>
      {/* Móvil: FAB en bottom-right */}
      <Button
        onClick={onClick}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:hidden',
          className
        )}
        size="icon"
        aria-label={label}
      >
        {icon || <Plus className="h-6 w-6" />}
      </Button>

      {/* Desktop: Botón normal en header (ya existe) */}
    </>
  );
}
```

**Usar en TicketsPage**:

```tsx
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';

function TicketsPage() {
  return (
    <>
      {/* Contenido existente */}
      <FloatingActionButton onClick={() => setCreateDialogOpen(true)} label="Nuevo ticket" />
    </>
  );
}
```

---

#### [ ] MF-006: Filtros colapsables en móvil (2 horas)

**Pattern**: Usar Collapsible de shadcn/ui

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

function Filters() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:hidden">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Filtros
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {/* Contenido de filtros */}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### ⚡ Performance Improvements

#### [ ] PERF-001: Lazy loading de routes (2 horas)

**Editar**: `apps/web/src/App.tsx` o archivo de rutas

```tsx
import { lazy, Suspense } from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ❌ ANTES - Import estático
import TicketsPage from '@/pages/dashboard/tickets/TicketsPage';
import ObrasPage from '@/pages/dashboard/obras/ObrasPage';
import FinanzasPage from '@/pages/dashboard/finanzas/FinanzasPage';

// ✅ DESPUÉS - Lazy loading
const TicketsPage = lazy(() => import('@/pages/dashboard/tickets/TicketsPage'));
const ObrasPage = lazy(() => import('@/pages/dashboard/obras/ObrasPage'));
const FinanzasPage = lazy(() => import('@/pages/dashboard/finanzas/FinanzasPage'));

// En el router
<Route
  path="/dashboard/tickets"
  element={
    <Suspense fallback={<SkeletonCard />}>
      <TicketsPage />
    </Suspense>
  }
/>;
```

**Beneficio esperado**: Reducción de bundle inicial de ~2MB a ~500KB

---

### 🎨 UX Refinements

#### [ ] UX-007: Migrar LoginPage a RHF + Button (1 hora)

**Editar**: `apps/web/src/pages/auth/LoginPage.tsx`

```tsx
// ❌ ANTES - useState directo
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// ✅ DESPUÉS - React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/core/Input';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
    } catch (err) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email')}
        type="email"
        placeholder="Email"
        error={errors.email?.message}
      />
      <Input
        {...register('password')}
        type="password"
        placeholder="Contraseña"
        error={errors.password?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Iniciando...' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
```

---

### 🎯 Resumen Fase 2

**Quick Wins**: 4 tareas = 80 min
**Mobile-First**: 2 tareas = 4h
**Performance**: 1 tarea = 2h
**UX Refinements**: 1 tarea = 1h

**Total**: 8 tareas = ~8 horas (prioridades máximas)
**Total completo**: 25 tareas = ~40 horas (todas las deudas UX)

---

## 🟢 Fase 3: Arquitectura y Escalabilidad (Sprint 3-8)

**Objetivo**: Código mantenible y escalable a largo plazo
**Duración estimada**: 2-3 meses
**Esfuerzo**: 80 horas
**Responsable**: Tech Lead + Team
**Prioridad**: P2 - Mejoras de calidad

### 🏗️ Refactorings Estructurales

#### [ ] ARCH-001: Split finanzas.controller.ts (4 horas)

**Problema**: 533 líneas en un solo archivo (viola SRP)

**Propuesta de estructura**:

```
apps/api/src/controllers/finanzas/
├── index.ts                    # Re-exporta todos los controllers
├── banco.controller.ts         # CRUD de bancos
├── cuenta.controller.ts        # CRUD de cuentas financieras
├── movimiento.controller.ts    # CRUD de movimientos
├── dashboard.controller.ts     # Dashboard y estadísticas
├── importacion.controller.ts   # Importación masiva
└── schemas/
    └── finanzas.schemas.ts     # Zod schemas compartidos
```

**Implementación**:

1. Crear carpeta `finanzas/`
2. Mover funciones relacionadas a archivos correspondientes
3. Actualizar imports en `finanzas.routes.ts`
4. Ejecutar tests para verificar que nada se rompió

---

#### [ ] ARCH-002: Mejorar error handler global (1 hora)

**Crear**: `apps/api/src/middlewares/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // AppError personalizado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Errores de Zod (validación)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: err.errors,
      },
    });
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'El registro ya existe',
          details: err.meta,
        },
      });
    }
    // Otros códigos de Prisma...
  }

  // Error genérico
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    },
  });
}
```

---

#### [ ] ARCH-003: Configurar Vitest + RTL (4 horas)

**Instalar dependencias**:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom --workspace=@siba/web
```

**Crear**: `apps/web/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Crear**: `apps/web/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

**Ejemplo de test**:

```typescript
// apps/web/src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

**Agregar script**: `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

#### [ ] ARCH-004: DataTable genérico (6 horas)

**Crear**: `apps/web/src/components/ui/DataTable.tsx`

Implementar tabla reutilizable con:

- Paginación
- Sorting
- Filtros
- Acciones por fila
- Selección múltiple
- Responsive (colapsa en móvil)

**Referencia**: shadcn/ui data-table pattern

---

#### [ ] ARCH-005: Virtual lists (4 horas)

```bash
npm install @tanstack/react-virtual --workspace=@siba/web
```

**Usar en tablas con >100 filas**:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeTable({ data }: { data: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={{ height: virtualRow.size }}>
            {data[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

#### [ ] ARCH-006: Framer Motion para animaciones (6 horas)

```bash
npm install framer-motion --workspace=@siba/web
```

**Ejemplos**:

```tsx
import { motion } from 'framer-motion';

// Fade in al montar
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <Card>...</Card>
</motion.div>

// Hover effect
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

### 🎯 Resumen Fase 3

**Refactorings**: 2 tareas = 5h
**Testing**: 1 tarea = 4h
**Components**: 2 tareas = 10h
**Animations**: 1 tarea = 6h

**Total prioritario**: ~25 horas
**Total completo**: ~80 horas (incluye WebSockets, Playwright E2E, etc.)

---

## 📊 Dashboard de Progreso

### Por Fase

| Fase      | Completadas | Total            | Progreso |
| --------- | ----------- | ---------------- | -------- |
| Fase 1    | 0           | 5                | 0%       |
| Fase 2    | 0           | 8 (prioritarias) | 0%       |
| Fase 3    | 0           | 6 (prioritarias) | 0%       |
| **TOTAL** | **0**       | **19**           | **0%**   |

### Por Tipo

| Tipo            | Completadas | Total |
| --------------- | ----------- | ----- |
| 🔴 Seguridad    | 0           | 5     |
| 🟡 UX/UI        | 0           | 15    |
| 🟢 Arquitectura | 0           | 6     |
| ⚡ Performance  | 0           | 10    |

---

## 🔄 Proceso de Actualización

Al completar una tarea:

1. Marcar checkbox: `[ ]` → `[x]`
2. Actualizar dashboard de progreso
3. Commit con mensaje descriptivo
4. Notificar en standup/slack

---

**Última actualización**: 2026-02-04
**Mantenido por**: Tech Lead
