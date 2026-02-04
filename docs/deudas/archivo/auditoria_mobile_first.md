> ⚠️ **NOTA**: Este documento fue consolidado en el Project Master Document.
>
> Ver información actualizada en:
>
> - [PROJECT_MASTER.md](../../PROJECT_MASTER.md) - Vista ejecutiva y semáforo de salud
> - [PRIORIDADES_ROADMAP.md](../PRIORIDADES_ROADMAP.md) - Plan de acción con checklists
> - [ux-performance.md](../ux-performance.md) - Consolidado de deudas UX/Performance
>
> Este archivo se mantiene como referencia histórica detallada.

---

# 📱 Mobile-First Architecture Audit

**Proyecto**: SIBA - Sistema de Gestión Empresarial
**Fecha**: 2026-02-04
**Auditor**: Mobile-First Architecture Specialist
**Framework CSS**: Tailwind CSS 3.4.17

---

## Puntaje de Fidelidad Mobile-First

| Aspecto                | Puntuación | Observación                                |
| ---------------------- | ---------- | ------------------------------------------ |
| **CSS Strategy**       | 8/10       | Tailwind usa `min-width` (Mobile-First) ✅ |
| **Relative Units**     | 6/10       | Mezcla de `px` y clases Tailwind           |
| **Fluid Typography**   | 5/10       | Sin `clamp()`, tamaños fijos               |
| **Content Priority**   | 7/10       | Sidebar oculto en mobile ✅                |
| **Touch Ergonomics**   | 7/10       | Botones 40px, algunos 32px                 |
| **Performance Mobile** | 6/10       | Sin lazy loading de assets                 |

### **Puntaje Global: 7.5/10**

> SIBA tiene una base sólida de Mobile-First gracias a Tailwind, pero necesita refinamiento en tipografía fluida, unidades relativas y optimización de carga.

---

## 1. Análisis de Estrategia CSS

### 1.1 Mobile-First Queries ✅

Tailwind CSS utiliza `min-width` por defecto (Mobile-First correcto):

```css
/* Tailwind genera esto internamente */
@media (min-width: 640px) {
  /* sm: */
}
@media (min-width: 768px) {
  /* md: */
}
@media (min-width: 1024px) {
  /* lg: */
}
```

**Breakpoints detectados en uso**:

| Breakpoint | Uso               | Archivos           |
| ---------- | ----------------- | ------------------ |
| `sm:`      | Layouts menores   | Dashboard, Forms   |
| `md:`      | Ocultar elementos | Search bar, Tables |
| `lg:`      | Sidebar/Desktop   | Layout principal   |
| `xl:`      | Pocos usos        | Dashboard grid     |

### 1.2 Unidades Absolutas vs Relativas ⚠️

| Patrón              | Ocurrencias     | Problema                      |
| ------------------- | --------------- | ----------------------------- |
| `px-8` (32px fijo)  | TopHeader       | No escala en móviles pequeños |
| `w-64` (256px fijo) | Sidebar width   | OK para sidebar               |
| `h-16` (64px fijo)  | Header height   | Podría ser `h-14 md:h-16`     |
| `text-2xl`          | Values en cards | OK, Tailwind escala           |
| `gap-6` (24px)      | Grids           | Podría ser `gap-4 md:gap-6`   |

**Archivos con `px` hardcodeado**:

```tsx
// ❌ TopHeader.tsx - padding fijo
<header className="... px-8 ...">

// ✅ Debería ser
<header className="... px-4 md:px-6 lg:px-8 ...">
```

### 1.3 Fluid Typography ❌

**No se detectó uso de `clamp()`** en ningún archivo.

| Elemento       | Actual                 | Recomendado                    |
| -------------- | ---------------------- | ------------------------------ |
| H1 Dashboard   | `text-3xl` (30px fijo) | `clamp(1.5rem, 4vw, 1.875rem)` |
| StatCard value | `text-2xl` (24px fijo) | `clamp(1.25rem, 3vw, 1.5rem)`  |
| Body text      | `text-sm` (14px)       | OK para legibilidad            |

---

## 2. Auditoría de Priorización de Contenido

### 2.1 The Thumb Zone - Ergonomía Táctil

```
┌────────────────────────────────────┐
│          HARD TO REACH             │  ← Header actions aquí
│                                    │
│    ┌────────────────────────┐      │
│    │                        │      │
│    │    NATURAL ZONE        │      │
│    │    (Ideal for CTAs)    │      │
│    │                        │      │
│    └────────────────────────┘      │
│                                    │
│           EASY REACH               │  ← FAB deberían ir aquí
│ [Nav]     [Home]    [+New]         │
└────────────────────────────────────┘
```

**Hallazgos**:

| Elemento           | Ubicación                | Veredicto               |
| ------------------ | ------------------------ | ----------------------- |
| **"NUEVO TICKET"** | Header derecha (difícil) | ⚠️ Agregar FAB móvil    |
| **Toggle Theme**   | Header derecha           | OK (acción secundaria)  |
| **Menu Hamburger** | Header izquierda         | ✅ Bien ubicado         |
| **Pagination**     | Bottom center            | ✅ Zona accesible       |
| **Table Actions**  | Row derecha              | ⚠️ Difícil con una mano |

### 2.2 Hidden Content Analysis

| Elemento        | Método            | Problema               |
| --------------- | ----------------- | ---------------------- |
| Sidebar desktop | `hidden lg:flex`  | ✅ Correcto            |
| Search bar      | `hidden md:block` | ✅ Correcto            |
| User name       | `hidden sm:block` | ✅ Correcto            |
| Filter selects  | Siempre visible   | ⚠️ Considerar colapsar |

**Contenido que SÍ carga aunque esté oculto**:

```tsx
// ⚠️ Esto carga el DOM aunque esté hidden
<div className="hidden md:block">
  <ExpensiveComponent />
</div>;

// ✅ Mejor: Renderizado condicional
{
  isDesktop && <ExpensiveComponent />;
}
```

### 2.3 Navigation Flow

| Métrica                      | Estado              | Mejora                         |
| ---------------------------- | ------------------- | ------------------------------ |
| **CTA Principal sin scroll** | ✅ Visible          | -                              |
| **Filtros accesibles**       | ⚠️ Requieren scroll | Colapsar en accordion          |
| **Menú hamburger**           | ✅ Accesible        | -                              |
| **Bottom nav móvil**         | ❌ No existe        | Agregar para navegación rápida |

---

## 3. Optimización de Rendimiento Móvil

### 3.1 Lazy Loading & Assets

| Asset            | Lazy Loading     | Recomendación              |
| ---------------- | ---------------- | -------------------------- |
| Logo Bauman      | ❌ No            | Es pequeño, OK             |
| Páginas/Routes   | ❌ No            | Crítico: usar `React.lazy` |
| DatePicker (9KB) | ❌ No            | Dynamic import             |
| Iconos Material  | ❌ Font completo | Considerar subset          |

### 3.2 Interacciones Táctiles

| Aspecto             | Estado             | Solución                               |
| ------------------- | ------------------ | -------------------------------------- |
| **300ms tap delay** | ⚠️ No verificado   | Verificar `touch-action: manipulation` |
| **Swipe gestures**  | ❌ No implementado | Agregar para Kanban cards              |
| **Pull-to-refresh** | ❌ No implementado | Considerar para listas                 |
| **Long press**      | ❌ No implementado | Para acciones contextuales             |

---

## 4. Refactor Checklist

### 4.1 Spacing & Units

| Archivo               | Línea | Actual              | Refactor               |
| --------------------- | ----- | ------------------- | ---------------------- |
| `TopHeader.tsx`       | 33    | `px-8`              | `px-4 md:px-6 lg:px-8` |
| `DashboardLayout.tsx` | 81    | `p-4 md:p-6 lg:p-8` | ✅ Ya correcto         |
| `TicketsPage.tsx`     | 100   | `p-6`               | `p-4 md:p-6`           |

### 4.2 Typography Fluida

```css
/* Agregar a index.css */
:root {
  --font-size-display: clamp(1.5rem, 4vw, 2rem);
  --font-size-title: clamp(1.125rem, 3vw, 1.5rem);
  --font-size-body: clamp(0.875rem, 2vw, 1rem);
}

.text-display {
  font-size: var(--font-size-display);
}
.text-title {
  font-size: var(--font-size-title);
}
```

### 4.3 Target Size (WCAG 2.2)

| Componente           | Actual   | Mínimo | Fix             |
| -------------------- | -------- | ------ | --------------- |
| Action buttons tabla | 32px     | 44px   | `p-2.5` → `p-3` |
| Toggle view icons    | 40px     | 44px   | Agregar padding |
| Pagination buttons   | Variable | 44px   | `h-11 min-w-11` |

### 4.4 Componentes a Refactorizar

- [ ] **TopHeader**: Padding responsivo
- [ ] **TicketsPage filters**: Colapsar en mobile
- [ ] **Pagination**: Tamaños mínimos táctiles
- [ ] **Table actions**: Aumentar target size
- [ ] **CTAs móvil**: Agregar FAB flotante

---

## 5. Ergonomic Heatmap Suggestions

### Mobile Bottom Navigation

```tsx
// Agregar a DashboardLayout.tsx
{
  /* Mobile Bottom Nav - Solo visible en móvil */
}
<nav
  className="lg:hidden fixed bottom-0 left-0 right-0 
                bg-white dark:bg-slate-900 
                border-t border-slate-200 dark:border-slate-800
                flex justify-around items-center h-16 z-40
                safe-area-inset-bottom"
>
  <NavItem to="/dashboard" icon="dashboard" label="Inicio" />
  <NavItem to="/tickets" icon="confirmation_number" label="Tickets" />
  <button className="relative -top-4 p-4 bg-brand rounded-full shadow-lg">
    <Plus className="h-6 w-6 text-white" />
  </button>
  <NavItem to="/obras" icon="construction" label="Obras" />
  <NavItem to="/perfil" icon="person" label="Perfil" />
</nav>;

{
  /* Agregar padding-bottom al contenido */
}
<main className="pb-20 lg:pb-0">...</main>;
```

### FAB para Acción Principal

```tsx
// Floating Action Button para móvil
<button
  className="lg:hidden fixed right-4 bottom-20 
                   p-4 bg-brand rounded-full shadow-xl
                   hover:scale-110 active:scale-95 transition-transform
                   z-30"
>
  <Plus className="h-6 w-6 text-white" />
</button>
```

---

## 6. Code Snippet: Componente Mobile-First

### Antes (Desktop-First implícito)

```tsx
// ❌ Padding fijo, sin adaptación
<div className="p-6 space-y-6">
  <h1 className="text-2xl font-bold">Tickets</h1>
  <div className="grid grid-cols-5 gap-4">{/* Filtros siempre visibles */}</div>
</div>
```

### Después (Mobile-First Refactorizado)

```tsx
// ✅ Mobile-First con responsive scaling
export default function TicketsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header con FAB móvil */}
      <div className="flex justify-between items-center">
        <h1
          className="text-xl md:text-2xl font-bold 
                       leading-tight tracking-tight"
        >
          Tickets de Servicio
        </h1>

        {/* Desktop CTA */}
        <Button className="hidden md:flex">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Filtros colapsables en mobile */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full justify-between"
        >
          <span>Filtros</span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')}
          />
        </Button>
      </div>

      {/* Filtros: accordion en mobile, grid en desktop */}
      <div
        className={cn(
          'bg-white dark:bg-slate-900 rounded-xl border p-4',
          'md:block', // Siempre visible en desktop
          filtersOpen ? 'block' : 'hidden md:block'
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <SearchInput className="sm:col-span-2" />
          <Select label="Estado" options={estados} />
          <Select label="Rubro" options={rubros} />
          <Select label="Tipo" options={tipos} />
        </div>
      </div>

      {/* Tabla con scroll horizontal en mobile */}
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <Table className="min-w-[640px] md:min-w-full" />
      </div>

      {/* FAB Móvil */}
      <button
        className="md:hidden fixed right-4 bottom-20 
                         p-4 bg-brand rounded-full shadow-xl z-30
                         active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}
```

---

## 7. Prioridades de Implementación

| Prioridad | Tarea                  | Esfuerzo | Impacto              |
| --------- | ---------------------- | -------- | -------------------- |
| 🔴 Alta   | Lazy loading de routes | 2h       | Bundle 40% menor     |
| 🔴 Alta   | FAB + Bottom Nav móvil | 3h       | UX móvil ++++        |
| 🟡 Media  | Padding responsivo     | 1h       | Consistencia         |
| 🟡 Media  | Filtros colapsables    | 2h       | Menos scroll móvil   |
| 🟡 Media  | Target size 44px       | 1h       | Accesibilidad táctil |
| 🟢 Baja   | Fluid typography       | 2h       | Pulido visual        |
| 🟢 Baja   | Swipe gestures         | 4h       | Interacción premium  |

---

## Conclusión

SIBA tiene una **arquitectura Mobile-First correcta** gracias a Tailwind (min-width queries), pero necesita refinamiento en:

1. **Espaciados responsivos**: Cambiar `p-6` por `p-4 md:p-6`
2. **Navegación táctil**: Agregar bottom nav + FAB
3. **Filtros**: Colapsar en accordions en móvil
4. **Performance**: Lazy loading obligatorio

Con estas mejoras, el puntaje subiría de **7.5/10 a 9/10**.
