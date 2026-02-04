# 🟡 Deudas Técnicas: UX/UI y Performance

> Consolidado de mejoras de experiencia de usuario y rendimiento del sistema.

**Estado**: Todas pendientes
**Esfuerzo total**: ~40 horas
**Prioridad**: P1 - Importante para competitividad

---

## 📊 Distribución por Categoría

| Categoría                | Cantidad | Esfuerzo | Fuentes                                             |
| ------------------------ | -------- | -------- | --------------------------------------------------- |
| **Mobile-First**         | 10       | ~12h     | auditoria_mobile_first.md                           |
| **Accesibilidad (A11y)** | 7        | ~8h      | auditoria_ux_product.md, auditoria_ux_innovation.md |
| **Micro-interacciones**  | 5        | ~6h      | auditoria_ux_innovation.md, auditoria_ux_product.md |
| **Performance**          | 8        | ~14h     | auditoria_ux_innovation.md                          |
| **TOTAL**                | **30**   | **~40h** | -                                                   |

---

## 🚀 Quick Wins (< 1 hora cada uno)

Tareas de alto impacto con bajo esfuerzo:

| ID           | Tarea                           | Tiempo | Impacto | Archivo Afectado                                                              |
| ------------ | ------------------------------- | ------ | ------- | ----------------------------------------------------------------------------- |
| **UX-010**   | Crear Skeleton component        | 20 min | Alto    | Crear [Skeleton.tsx](../../apps/web/src/components/ui/Skeleton.tsx)           |
| **UX-011**   | Crear ConfirmDialog component   | 30 min | Alto    | Crear [ConfirmDialog.tsx](../../apps/web/src/components/ui/ConfirmDialog.tsx) |
| **MF-001**   | Responsive padding en TopHeader | 10 min | Medio   | [TopHeader.tsx:15](../../apps/web/src/components/layout/TopHeader.tsx)        |
| **A11Y-001** | aria-invalid en Input           | 20 min | Alto    | [Input.tsx](../../apps/web/src/components/ui/core/Input.tsx)                  |

**Total**: 80 minutos para 4 mejoras significativas

**Ver snippets completos en**: [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md#quick-wins)

---

## 📱 Mobile-First (10 deudas)

### MF-001: Padding No Responsivo en TopHeader

**Archivo**: [TopHeader.tsx](../../apps/web/src/components/layout/TopHeader.tsx) línea ~15

**Problema**:

```tsx
// ❌ Padding fijo de 32px en todas las pantallas
<header className="px-8 py-4">
```

**Solución**:

```tsx
// ✅ Padding adaptativo por breakpoint
<header className="px-4 py-3 md:px-6 md:py-4 lg:px-8">
```

**Impacto**: Mejor uso de espacio en pantallas pequeñas
**Esfuerzo**: 10 min

---

### MF-002: Sin FAB para Acción Principal en Móvil

**Archivos afectados**:

- [TicketsPage.tsx](../../apps/web/src/pages/dashboard/tickets/TicketsPage.tsx)
- Crear: [FloatingActionButton.tsx](../../apps/web/src/components/layout/FloatingActionButton.tsx)

**Problema**: Botón "Nuevo Ticket" en header superior (difícil alcanzar con pulgar en móvil)

**Solución**: Agregar FAB (Floating Action Button) en bottom-right para móviles

**Beneficios**:

- Ergonomía táctil mejorada
- UX móvil moderna y competitiva
- Acceso rápido a acción principal

**Esfuerzo**: 2 horas
**Ver snippet completo**: [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md#mf-002-fab-para-acci%C3%B3n-principal-en-m%C3%B3vil-2-horas)

---

### MF-003: Sin Bottom Navigation en Móvil

**Problema**: Navegación solo disponible en sidebar (no óptimo para móvil)

**Solución**: Implementar bottom navigation bar para móviles con 4-5 items principales

**Esfuerzo**: 3 horas

---

### MF-004: Filtros No Colapsables en Móvil

**Archivo**: [TicketsPage.tsx](../../apps/web/src/pages/dashboard/tickets/TicketsPage.tsx)

**Problema**: Filtros siempre expandidos ocupan espacio valioso

**Solución**: Usar Collapsible de shadcn/ui para colapsar filtros por defecto en móvil

**Esfuerzo**: 2 horas
**Ver snippet**: [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md#mf-006-filtros-colapsables-en-m%C3%B3vil-2-horas)

---

### MF-005: Target Size < 44px en Botones de Acción

**Archivos afectados**: Múltiples componentes de tabla

**Problema**: Botones de acciones en tablas tienen ~32-40px (mínimo WCAG: 44x44px)

**Solución**:

```tsx
// ❌ Botón pequeño
<Button size="icon" className="h-8 w-8"> {/* 32px */}

// ✅ Tamaño accesible
<Button size="icon" className="h-11 w-11"> {/* 44px */}
```

**Esfuerzo**: 1 hora (revisar todos los componentes de tabla)

---

### MF-006-MF-010: Otras Deudas Mobile-First

| ID     | Deuda                                   | Esfuerzo |
| ------ | --------------------------------------- | -------- |
| MF-006 | Tipografía no fluida (sin clamp())      | 2h       |
| MF-007 | Sin gestos táctiles (swipe, long-press) | 4h       |
| MF-008 | Sin pull-to-refresh                     | 2h       |
| MF-009 | DatePicker no optimizado para móvil     | 2h       |
| MF-010 | Modal full-screen en móvil              | 1h       |

**Esfuerzo total Mobile-First**: ~19 horas

---

## ♿ Accesibilidad (A11y) - 7 deudas

### A11Y-001: Input sin aria-invalid

**Archivo**: [Input.tsx](../../apps/web/src/components/ui/core/Input.tsx)

**Problema**: Screen readers no anuncian errores de validación

**Solución**:

```tsx
<input
  aria-invalid={error ? 'true' : 'false'}
  aria-describedby={error ? `${id}-error` : undefined}
/>;
{
  error && (
    <p id={`${id}-error`} role="alert" className="text-destructive">
      {error}
    </p>
  );
}
```

**WCAG Level**: A (obligatorio)
**Esfuerzo**: 20 min

---

### A11Y-002: Errores sin role="alert"

**Archivos afectados**: Múltiples componentes de formulario

**Problema**: Errores no son anunciados dinámicamente a screen readers

**Solución**: Agregar `role="alert"` a mensajes de error

**Esfuerzo**: 30 min

---

### A11Y-003: Sin aria-live para Cambios Dinámicos

**Archivo**: [TicketsPage.tsx](../../apps/web/src/pages/dashboard/tickets/TicketsPage.tsx) (Kanban)

**Problema**: Cambios de estado de tickets no anunciados

**Solución**:

```tsx
<div aria-live="polite" aria-atomic="true">
  Ticket movido a {newStatus}
</div>
```

**Esfuerzo**: 1 hora

---

### A11Y-004-A11Y-007: Otras Deudas de Accesibilidad

| ID       | Deuda                                    | Esfuerzo |
| -------- | ---------------------------------------- | -------- |
| A11Y-004 | Labels sin htmlFor                       | 1h       |
| A11Y-005 | Sin prefers-reduced-motion               | 2h       |
| A11Y-006 | Contraste insuficiente en algunos textos | 2h       |
| A11Y-007 | Iconos sin aria-label                    | 1h       |

**Esfuerzo total A11y**: ~8 horas

---

## 🎨 Micro-interacciones (5 deudas)

### UX-001: Sin Animaciones Premium

**Problema**: Solo `transition-all` genérico, sin micro-animaciones pulidas

**Solución**: Integrar Framer Motion para:

- Fade in/out suaves
- Hover effects (scale, translateY)
- Page transitions
- Skeleton shimmer

**Librería**: `framer-motion@12`

**Esfuerzo**: 6 horas

---

### UX-002: Hover de Filas Muy Sutil

**Archivos**: Componentes de tabla

**Problema**:

```tsx
// ❌ Hover casi imperceptible
<tr className="hover:bg-muted">
```

**Solución**:

```tsx
// ✅ Hover premium con elevación
<motion.tr
  whileHover={{
    backgroundColor: 'rgb(var(--muted))',
    scale: 1.01,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }}
>
```

**Esfuerzo**: 2 horas (requiere Framer Motion)

---

### UX-003-UX-005: Otras Micro-interacciones

| ID     | Deuda                                  | Esfuerzo |
| ------ | -------------------------------------- | -------- |
| UX-003 | Sin feedback al crear ticket           | 1h       |
| UX-004 | Pagination sin transición              | 1h       |
| UX-005 | Toggle vista tabla/kanban poco visible | 1h       |

**Esfuerzo total**: ~11 horas

---

## ⚡ Performance (8 deudas)

### PERF-001: Sin Lazy Loading de Routes

**Archivo**: [App.tsx](../../apps/web/src/App.tsx) o archivo de routing

**Problema**: Todas las páginas cargadas en bundle inicial (~2MB)

**Solución**:

```tsx
// ❌ Import estático
import TicketsPage from '@/pages/tickets/TicketsPage';

// ✅ Lazy loading
const TicketsPage = lazy(() => import('@/pages/tickets/TicketsPage'));

<Route
  path="/tickets"
  element={
    <Suspense fallback={<SkeletonPage />}>
      <TicketsPage />
    </Suspense>
  }
/>;
```

**Beneficio esperado**: Bundle inicial de 500KB vs 2MB (reducción del 75%)

**Esfuerzo**: 2 horas

---

### PERF-002: Sin Code Splitting

**Problema**: Librerías grandes cargadas aunque no se usen (ej: DatePicker ~9KB)

**Solución**: Dynamic imports para componentes pesados

```tsx
const DatePicker = lazy(() => import('@/components/ui/date-picker'));
```

**Esfuerzo**: 2 horas

---

### PERF-003: React.memo No Sistemático

**Problema**: Componentes se re-renderizan innecesariamente

**Solución**: Aplicar React.memo a componentes puros

```tsx
export const PureComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});
```

**Esfuerzo**: 3 horas (auditar todos los componentes)

---

### PERF-004: Sin Virtual Lists para Tablas Grandes

**Problema**: Renderizar 1000+ filas causa lag

**Solución**: Integrar `@tanstack/react-virtual`

**Beneficio**: Renderizar solo filas visibles (30-50) en lugar de todas

**Esfuerzo**: 4 horas

**Ver snippet**: [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md#arch-005-virtual-lists-4-horas)

---

### PERF-005: Prisma select vs include

**Archivo Backend**: Controllers (finanzas, tickets, etc.)

**Problema**:

```typescript
// ❌ Trae TODOS los campos + relaciones completas
const tickets = await prisma.ticket.findMany({
  include: { cliente: true, sucursal: true },
});
```

**Solución**:

```typescript
// ✅ Solo campos necesarios
const tickets = await prisma.ticket.findMany({
  select: {
    id: true,
    descripcion: true,
    cliente: { select: { id: true, razonSocial: true } },
  },
});
```

**Beneficio**: Reducción de payload 60-80%

**Esfuerzo**: 3 horas

---

### PERF-006-PERF-008: Otras Deudas de Performance

| ID       | Deuda                                       | Esfuerzo |
| -------- | ------------------------------------------- | -------- |
| PERF-006 | Sin prefetching con TanStack Query          | 2h       |
| PERF-007 | useMemo/useCallback uso inconsistente       | 3h       |
| PERF-008 | Sin indexes en BD para búsquedas frecuentes | 2h       |

**Esfuerzo total Performance**: ~21 horas

---

## 🎯 Inconsistencias de Código

### UX-007: LoginPage No Usa Componentes Estándar

**Archivo**: [LoginPage.tsx](../../apps/web/src/pages/auth/LoginPage.tsx)

**Problemas**:

1. No usa `Button` component (botón custom con estilos inline)
2. Usa `useState` directo en lugar de React Hook Form + Zod
3. `console.error(err)` expone datos en producción

**Solución**: Migrar a patrón estándar del proyecto

**Esfuerzo**: 1 hora

**Ver snippet completo**: [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md#ux-007-migrar-loginpage-a-rhf--button-1-hora)

---

### UX-008: Iconografía Mixta

**Problema**: Material Symbols + Lucide (confuso)

**Solución**: Estandarizar en Lucide React (ya usado en 90% del código)

**Esfuerzo**: 2 horas

---

### UX-009: Cards con border-radius Inconsistente

**Problema**: `rounded-3xl` en StatCard vs `rounded-xl` en otros

**Solución**: Estandarizar en `rounded-xl` (12px)

**Esfuerzo**: 30 min

---

## 🚀 Roadmap Priorizado

### Sprint 1 (Quick Wins - 1 día)

- [x] UX-010: Skeleton component (20 min)
- [x] UX-011: ConfirmDialog (30 min)
- [x] MF-001: Responsive padding (10 min)
- [x] A11Y-001: aria-invalid (20 min)

**Total**: 80 minutos

### Sprint 2-3 (UX Crítico - 1 semana)

- [ ] PERF-001: Lazy loading routes (2h)
- [ ] MF-002: FAB móvil (2h)
- [ ] MF-004: Filtros colapsables (2h)
- [ ] UX-007: Migrar LoginPage (1h)

**Total**: 7 horas

### Sprint 4-8 (Mejoras Profundas - 2-4 semanas)

- [ ] UX-001: Framer Motion (6h)
- [ ] PERF-004: Virtual lists (4h)
- [ ] PERF-003: React.memo audit (3h)
- [ ] A11y completo (8h)

**Total**: ~21 horas

---

## 📊 Dashboard de Progreso

| Categoría           | Completadas | Total  | Progreso |
| ------------------- | ----------- | ------ | -------- |
| Mobile-First        | 0           | 10     | 0%       |
| Accesibilidad       | 0           | 7      | 0%       |
| Micro-interacciones | 0           | 5      | 0%       |
| Performance         | 0           | 8      | 0%       |
| **TOTAL**           | **0**       | **30** | **0%**   |

---

## 📚 Referencias

### Auditorías Originales

- [auditoria_mobile_first.md](./archivo/auditoria_mobile_first.md) - Responsive design completo
- [auditoria_ux_innovation.md](./archivo/auditoria_ux_innovation.md) - Performance y DX
- [auditoria_ux_product.md](./archivo/auditoria_ux_product.md) - Consistencia visual

### Skills Relacionadas

- [siba-responsive](../../.agent/skills/siba-responsive/SKILL.md)
- [siba-a11y](../../.agent/skills/siba-a11y/SKILL.md)
- [siba-components](../../.agent/skills/siba-components/SKILL.md)
- [siba-optimizations](../../.agent/skills/siba-optimizations/SKILL.md)

### Guías Externas

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Mobile-First Design](https://web.dev/mobile-first/)

---

**Última actualización**: 2026-02-04
**Responsable**: Frontend Lead
