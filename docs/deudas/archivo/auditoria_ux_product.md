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

# 🎨 UX/UI Product Audit - SIBA

**Proyecto**: SIBA - Sistema de Gestión Empresarial
**Fecha**: 2026-02-04
**Auditor**: Senior UX/UI Product Auditor  
**Metodología**: Heurísticas de Nielsen + WCAG 2.2 + Tendencias 2026

---

## Resumen Visual del Sistema

| Elemento           | Implementación Actual       | Calidad    |
| ------------------ | --------------------------- | ---------- |
| **Tipografía**     | Manrope (Google Fonts)      | ⭐⭐⭐⭐⭐ |
| **Paleta**         | CSS Variables con dark mode | ⭐⭐⭐⭐⭐ |
| **Iconografía**    | Material Symbols + Lucide   | ⭐⭐⭐⭐   |
| **Espaciado**      | Tailwind consistente        | ⭐⭐⭐⭐   |
| **Animaciones**    | Básicas (transition-all)    | ⭐⭐       |
| **Loading States** | Spinners genéricos          | ⭐⭐       |

---

## 1. Análisis Heurístico y Usabilidad

### 1.1 Consistencia y Estándares

| Elemento    | Hallazgo                                                               | Veredicto        |
| ----------- | ---------------------------------------------------------------------- | ---------------- |
| **Botones** | 5 variants bien definidos (primary, secondary, ghost, outline, danger) | ✅ Excelente     |
| **Inputs**  | Estilo consistente con estados focus/error                             | ✅ Bueno         |
| **Iconos**  | Mezcla Material Symbols + Lucide puede confundir                       | ⚠️ Unificar      |
| **Cards**   | `rounded-3xl` en StatCard vs `rounded-xl` en otros                     | ⚠️ Inconsistente |
| **Colors**  | CSS Variables garantizan consistencia                                  | ✅ Excelente     |

### 1.2 Prevención y Manejo de Errores

| Estado                  | Implementación                  | Calidad               |
| ----------------------- | ------------------------------- | --------------------- |
| **Loading**             | Spinner genérico `animate-spin` | ⚠️ Mejorable          |
| **Success**             | Toast via Sonner                | ✅ Bueno              |
| **Error Form**          | Texto rojo bajo input           | ⚠️ Sin `role="alert"` |
| **Empty State**         | Componente EmptyState existe    | ✅ Bueno              |
| **Error Crítico**       | ErrorBoundary en App.tsx        | ✅ Implementado       |
| **Confirmación Delete** | `window.confirm()` nativo       | ❌ No premium         |

### 1.3 Carga Cognitiva (Ley de Hick)

| Pantalla        | Problema                               | Severidad             |
| --------------- | -------------------------------------- | --------------------- |
| **TicketsPage** | 5 columnas de filtros visibles siempre | ⚠️ Colapsar en mobile |
| **Sidebar**     | 7 menús principales + submenús         | ⚠️ Considerar grupos  |
| **Forms**       | Bien segmentados con headers           | ✅ OK                 |
| **Dashboard**   | 4 KPIs + alerts visible                | ✅ Balanceado         |

---

## 2. Interfaz y Estética Moderna (UI)

### 2.1 Visual Refresh - Tendencias 2026

| Tendencia                 | Estado en SIBA              | Recomendación                    |
| ------------------------- | --------------------------- | -------------------------------- |
| **Bento Grid**            | ❌ No usado                 | Dashboard con cards estilo Bento |
| **Glassmorphism**         | ⚠️ Solo en backdrops        | Agregar a tooltips y dropdowns   |
| **Neobrutalismo**         | ❌ No aplica                | Demasiado informal para ERP      |
| **Minimalismo Funcional** | ✅ Implementado             | Mantener y refinar               |
| **Gradientes Sutiles**    | ✅ En Login y Dashboard     | Expandir a CTAs                  |
| **Micro-sombras**         | ✅ `luxury-shadow` definido | Usar más consistentemente        |

### 2.2 Jerarquía Visual

| CTA                        | Visibilidad              | Mejora Sugerida              |
| -------------------------- | ------------------------ | ---------------------------- |
| **"NUEVO TICKET"**         | ✅ Alta                  | Agregar gradiente animado    |
| **Botón Guardar en Forms** | ✅ Buena                 | -                            |
| **Toggle Table/Kanban**    | ⚠️ Muy sutil             | Incrementar contraste activo |
| **Pagination**             | ⚠️ Baja prioridad visual | Números más prominentes      |
| **Edit/Delete Actions**    | ⚠️ Iconos pequeños       | Aumentar target a 44px       |

### 2.3 Accesibilidad (WCAG 2.2)

| Criterio                 | Estado              | Acción                           |
| ------------------------ | ------------------- | -------------------------------- |
| **Contraste Texto**      | ✅ 4.5:1+           | Cumple                           |
| **Target Size**          | ⚠️ 32px algunos     | Mínimo 44×44px                   |
| **Focus Visible**        | ✅ Implementado     | Cumple                           |
| **aria-label en iconos** | ⚠️ Falta en algunos | Agregar a icon-only buttons      |
| **aria-invalid**         | ❌ No implementado  | Agregar a Input.tsx              |
| **Reduced Motion**       | ❌ No respetado     | Agregar `prefers-reduced-motion` |

---

## 3. Dinamismo e Innovación

### 3.1 Micro-interacciones Actuales vs Sugeridas

| Interacción      | Actual                  | Premium Upgrade             |
| ---------------- | ----------------------- | --------------------------- |
| **Button Click** | `active:scale-[0.98]`   | ✅ Ya premium               |
| **Icon Hover**   | `group-hover:scale-110` | ✅ Ya premium               |
| **Modal Open**   | `zoom-in-95 fade-in`    | ✅ Bueno                    |
| **Page Load**    | `animate-in fade-in`    | ⚠️ Agregar stagger          |
| **Row Hover**    | Solo bg color change    | Agregar `translateX(4px)`   |
| **Toast Appear** | Sonner default          | Considerar custom con brand |
| **Loading Data** | Spinner                 | ❌ Cambiar a Skeleton       |
| **Form Submit**  | Button spinner          | Agregar success checkmark   |

### 3.2 Patrones de Diseño - Sustituciones

| Actual             | Alternativa Moderna                 | Beneficio           |
| ------------------ | ----------------------------------- | ------------------- |
| `window.confirm()` | `AlertDialog` (Radix)               | Consistencia visual |
| Spinner loading    | **Skeleton shimmer**                | Menos ansiedad      |
| Modal para todo    | **Sheet/Drawer** para forms largos  | Mejor en mobile     |
| Select nativo      | Combobox con search                 | Ya tienen ✅        |
| Pagination clásica | **Infinite scroll** o **Load more** | Menos fricción      |
| Tooltip nativo     | **Radix Tooltip** con delay         | Más control         |

### 3.3 Dark Mode y Responsividad

| Aspecto               | Estado                    | Observación      |
| --------------------- | ------------------------- | ---------------- |
| **Dark Mode Toggle**  | ✅ En header              | Funcional        |
| **System Preference** | ✅ Auto-detect            | Implementado     |
| **Sidebar Mobile**    | ✅ Drawer slide           | Bien ejecutado   |
| **Tables Mobile**     | ⚠️ Solo scroll horizontal | Considerar cards |
| **Forms Mobile**      | ✅ Stack vertical         | OK               |

---

## 4. UX Audit Table - Fricción × Severidad

| Punto de Fricción                      | Severidad | Recomendación de Mejora                   |
| :------------------------------------- | :-------: | :---------------------------------------- |
| `window.confirm()` para eliminar       |     5     | Crear `ConfirmDialog` component con Radix |
| Spinner genérico en tablas             |     4     | Implementar `Skeleton` rows con shimmer   |
| Sin feedback visual al crear ticket    |     4     | Agregar success animation + toast         |
| Iconos mezclan Material + Lucide       |     3     | Unificar en Lucide exclusivamente         |
| Botones action muy pequeños (32px)     |     4     | Aumentar a 44×44px para accesibilidad     |
| Toggle vista tabla/kanban poco visible |     3     | Agregar indicador activo más fuerte       |
| Error forms sin `role="alert"`         |     4     | Agregar ARIA para screen readers          |
| Pagination sin indicador de total      |     2     | Mostrar "1-10 de 234 resultados"          |
| Cards con diferentes border-radius     |     3     | Estandarizar a `rounded-2xl` everywhere   |
| Sin skeleton en Dashboard KPIs         |     3     | Agregar loading state premium             |
| LoginPage no usa Button component      |     3     | Refactorizar para consistencia            |
| Sin animación en navegación            |     2     | Page transitions con Framer Motion        |
| Filtros siempre expandidos en mobile   |     4     | Colapsar en drawer/accordion              |
| Hover de filas muy sutil               |     2     | Agregar `translateX` + sombra             |
| Sin prefers-reduced-motion             |     3     | Respetar preferencia de accesibilidad     |

---

## 5. UI Moodboard Suggestions

### 5.1 Librerías Recomendadas

| Librería                       | Versión      | Uso Principal               | Prioridad |
| ------------------------------ | ------------ | --------------------------- | --------- |
| `framer-motion`                | ^12.0        | Micro-interacciones premium | 🔴 Alta   |
| `@radix-ui/react-alert-dialog` | ^1.0         | Reemplazo de confirm()      | 🔴 Alta   |
| `@radix-ui/react-tooltip`      | ^1.0         | Tooltips consistentes       | 🟡 Media  |
| `sonner`                       | Ya tienen ✅ | Toasts                      | -         |
| `lucide-react`                 | Ya tienen ✅ | Iconografía                 | -         |
| `cmdk`                         | Ya tienen ✅ | Command palette             | -         |

### 5.2 Paleta de Micro-interacciones

```css
/* Agregar a index.css */

/* Premium Hover States */
.row-hover-premium {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.row-hover-premium:hover {
  transform: translateX(4px);
  box-shadow: -4px 0 0 var(--brand-color);
}

/* Skeleton Shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.3 Referentes Visuales 2026

| Plataforma           | Qué Copiar                         |
| -------------------- | ---------------------------------- |
| **Linear.app**       | Micro-animaciones, gradientes CTAs |
| **Notion**           | Skeleton loaders, tooltips         |
| **Vercel Dashboard** | Cards con hover states             |
| **Stripe Dashboard** | Tablas con acciones inline         |
| **GitHub**           | Command palette (ya tienen cmdk)   |

---

## 6. Quick Wins - Implementar Hoy

### 🚀 Quick Win #1: ConfirmDialog Component

**Tiempo**: 30 minutos  
**Impacto**: Elimina `window.confirm()` en todo el proyecto

```tsx
// components/ui/core/ConfirmDialog.tsx
import { DialogBase } from './DialogBase';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
  variant = 'danger',
}: ConfirmDialogProps) => (
  <DialogBase
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    maxWidth="sm"
    icon={
      <div
        className={`p-2 rounded-xl ${
          variant === 'danger'
            ? 'bg-red-100 dark:bg-red-900/20'
            : 'bg-amber-100 dark:bg-amber-900/20'
        }`}
      >
        <AlertTriangle
          className={`h-5 w-5 ${variant === 'danger' ? 'text-red-500' : 'text-amber-500'}`}
        />
      </div>
    }
    footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
          Confirmar
        </Button>
      </>
    }
  >
    <p className="text-slate-600 dark:text-slate-400">{message}</p>
  </DialogBase>
);
```

---

### 🚀 Quick Win #2: Skeleton Component con Shimmer

**Tiempo**: 20 minutos  
**Impacto**: Loading states premium en toda la app

```tsx
// components/ui/core/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export const Skeleton = ({ className, variant = 'text' }: SkeletonProps) => (
  <div
    className={cn(
      'animate-pulse relative overflow-hidden',
      'bg-slate-200 dark:bg-slate-700',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
      'before:animate-[shimmer_1.5s_infinite]',
      variant === 'text' && 'h-4 rounded',
      variant === 'circular' && 'rounded-full',
      variant === 'rectangular' && 'rounded-lg',
      variant === 'card' && 'rounded-2xl h-32',
      className
    )}
  />
);

// Table skeleton helper
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);
```

**Agregar a tailwind.config.js**:

```js
keyframes: {
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
},
animation: {
  shimmer: 'shimmer 1.5s infinite',
},
```

---

### 🚀 Quick Win #3: Row Hover Premium

**Tiempo**: 10 minutos  
**Impacto**: Sensación más interactiva en todas las tablas

```tsx
// En cualquier tabla, reemplazar:

// ❌ Antes
<tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">

// ✅ Después
<tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50
              transition-all hover:translate-x-1
              hover:shadow-[-4px_0_0_var(--brand-color)]">
```

---

## 7. Conclusión

SIBA tiene una **base de diseño sólida** con un sistema de tokens bien implementado y dark mode funcional. Las principales oportunidades de mejora son:

| Área                    | Estado | Acción Inmediata                     |
| ----------------------- | ------ | ------------------------------------ |
| **Consistencia**        | 85%    | Unificar border-radius e iconografía |
| **Feedback Visual**     | 60%    | Skeleton + ConfirmDialog             |
| **Micro-interacciones** | 50%    | Framer Motion + row hover            |
| **Accesibilidad**       | 70%    | ARIA attributes + target size        |

Con los 3 Quick Wins implementados, la percepción de calidad del producto aumentará significativamente sin un gran esfuerzo de desarrollo.

---

> **Próximo paso recomendado**: Implementar Quick Wins 1-3 mañana (~1 hora total) y luego evaluar Framer Motion para transiciones de página.
