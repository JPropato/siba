---
name: bauman-design-system
description: Sistema de diseño para el ERP Sistema Bauman. Debe usarse SIEMPRE al crear o modificar componentes UI, páginas, formularios, o cualquier elemento visual. Garantiza consistencia en colores, tipografía, componentes, responsive y patrones de la aplicación.
---

# Sistema de Diseño Bauman

Referencia obligatoria al desarrollar UI para Sistema Bauman. 
**Estilos: Dark Mode + Light Mode** | **Responsive: Mobile-first**

---

## ⚠️ Reglas Críticas

1. **SIEMPRE responsive** - Mobile-first, todo debe funcionar en 375px+
2. **SIEMPRE ambos modos** - Light y Dark mode con `dark:` prefix
3. **NUNCA emojis** - Solo iconos Lucide
4. **NUNCA colores hardcodeados** - Usar CSS variables

---

## Paleta de Colores

### Light Mode
| Token | Tailwind | Uso |
|-------|----------|-----|
| background | `zinc-50` | Fondo principal |
| surface | `white` | Cards |
| border | `zinc-200` | Bordes |
| text-primary | `zinc-900` | Texto principal |
| text-secondary | `zinc-600` | Texto secundario |
| text-muted | `zinc-400` | Placeholders |

### Dark Mode
| Token | Tailwind | Uso |
|-------|----------|-----|
| background | `zinc-950` | Fondo principal |
| surface | `zinc-900` | Cards |
| border | `zinc-800` | Bordes |
| text-primary | `zinc-50` | Texto principal |
| text-secondary | `zinc-400` | Texto secundario |
| text-muted | `zinc-500` | Placeholders |

### Semánticos (ambos modos)
| Token | Light | Dark |
|-------|-------|------|
| success | `emerald-600` | `emerald-400` |
| warning | `amber-600` | `amber-400` |
| error | `red-600` | `red-400` |
| info | `blue-600` | `blue-400` |

---

## Responsive Breakpoints

```
Mobile:   < 768px  (default, mobile-first)
Tablet:   md: 768px
Desktop:  lg: 1024px
Wide:     xl: 1280px
```

### Layout por Breakpoint

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Sidebar | Oculto (Sheet) | Colapsado (iconos) | Expandido 240px |
| Header | Hamburger menu | Full | Full |
| Grid cols | 1 | 2 | 3-4 |
| Cards | Stack vertical | 2 cols | 3+ cols |
| Tables | Scroll horizontal | Scroll | Full |

---

## Clases Base (con Dark Mode)

### Backgrounds
```tsx
// Fondo principal
className="bg-zinc-50 dark:bg-zinc-950"

// Cards
className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"

// Sidebar
className="bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800"
```

### Texto
```tsx
// Principal
className="text-zinc-900 dark:text-zinc-50"

// Secundario
className="text-zinc-600 dark:text-zinc-400"

// Muted
className="text-zinc-400 dark:text-zinc-500"
```

### Botones
```tsx
// Primario
className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"

// Secundario
className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
```

---

## Layout Responsive

### Sidebar Pattern
```tsx
// Desktop: visible | Mobile: Sheet
<aside className="hidden lg:flex w-60 ...">
  {/* Desktop sidebar */}
</aside>

<Sheet> {/* Mobile */}
  <SheetTrigger className="lg:hidden">
    <Menu />
  </SheetTrigger>
  <SheetContent side="left">...</SheetContent>
</Sheet>
```

### Grid Responsive
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

### Content Padding
```tsx
<main className="p-4 md:p-6 lg:p-8">
```

---

## Estados de Badges

### Tickets
| Estado | Classes |
|--------|---------|
| Abierto | `bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300` |
| En Progreso | `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400` |
| Resuelto | `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` |
| Cancelado | `bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500` |

---

## Componentes shadcn/ui

```bash
npx shadcn-ui@latest init
# Seleccionar: zinc, CSS variables, dark mode support
```

Componentes requeridos:
- Button, Input, Select, Textarea
- Table, DataTable
- Dialog, Sheet (para mobile sidebar)
- Card, Badge, Tabs
- Toast, Form
- DropdownMenu, Command (Cmd+K)

---

## CSS Variables

```css
:root {
  --background: 250 250 250;
  --foreground: 24 24 27;
  --card: 255 255 255;
  --border: 228 228 231;
}

.dark {
  --background: 9 9 11;
  --foreground: 250 250 250;
  --card: 24 24 27;
  --border: 39 39 42;
}
```

---

## Checklist Pre-Desarrollo

- [ ] Componente funciona en 375px (iPhone SE)
- [ ] Componente tiene clases `dark:`
- [ ] No hay emojis como iconos
- [ ] Sidebar es Sheet en mobile
- [ ] Tablas tienen scroll horizontal en mobile
- [ ] Touch targets mínimo 44x44px

## Logo

`assets/logo-bauman.png`
