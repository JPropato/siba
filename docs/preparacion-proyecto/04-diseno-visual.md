# Sistema Bauman - Diseño Visual y UI/UX

> **Fecha**: 2026-01-17  
> **Versión**: 1.1  
> **Tipo de producto**: ERP/Dashboard interno para empresa de construcción

---

## ⚠️ Requisitos Críticos

| Requisito | Descripción |
|-----------|-------------|
| **Responsive** | Mobile-first, funciona desde 375px |
| **Dual Mode** | Light mode + Dark mode obligatorios |
| **Accesible** | Touch targets 44px+, contraste WCAG |

---

## 🎨 Sistema de Diseño

### Estilo: **Professional Dashboard - Dual Mode**

- **Profesional**: Sin elementos lúdicos
- **Funcional**: Priorizar usabilidad
- **Minimalista**: Tonos grises/neutros elegantes
- **Responsive**: Mobile-first

### Anti-Patrones
- ❌ Emojis como iconos (usar Lucide)
- ❌ Colores saturados/neón
- ❌ Fondos blancos puros en dark mode
- ❌ Componentes que no funcionan en mobile

---

## 🎨 Paleta de Colores

### Light Mode (Zinc)

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| background | `zinc-50` | #FAFAFA | Fondo principal |
| surface | `white` | #FFFFFF | Cards |
| border | `zinc-200` | #E4E4E7 | Bordes |
| text-primary | `zinc-900` | #18181B | Texto principal |
| text-secondary | `zinc-600` | #52525B | Texto secundario |
| text-muted | `zinc-400` | #A1A1AA | Placeholders |

### Dark Mode (Zinc)

| Token | Tailwind | Hex | Uso |
|-------|----------|-----|-----|
| background | `zinc-950` | #09090B | Fondo principal |
| surface | `zinc-900` | #18181B | Cards |
| border | `zinc-800` | #27272A | Bordes |
| text-primary | `zinc-50` | #FAFAFA | Texto principal |
| text-secondary | `zinc-400` | #A1A1AA | Texto secundario |
| text-muted | `zinc-500` | #71717A | Placeholders |

### Semánticos (ambos modos)

| Token | Light | Dark |
|-------|-------|------|
| success | `emerald-600` | `emerald-400` |
| warning | `amber-600` | `amber-400` |
| error | `red-600` | `red-400` |
| info | `blue-600` | `blue-400` |

### CSS Variables

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

## � Responsive Design

### Breakpoints

| Nombre | Width | Tailwind |
|--------|-------|----------|
| Mobile | < 768px | (default) |
| Tablet | ≥ 768px | `md:` |
| Desktop | ≥ 1024px | `lg:` |
| Wide | ≥ 1280px | `xl:` |

### Layout por Breakpoint

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Sidebar | Sheet (hamburger) | Colapsado (64px) | Expandido (240px) |
| Header | Hamburger + logo | Full | Full |
| Grid | 1 col | 2 cols | 3-4 cols |
| Tables | Horizontal scroll | Scroll | Full |
| Cards | Stack | 2 cols | 3+ cols |

### Estructura Desktop

```
┌──────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px)  │            MAIN CONTENT                      │
│                   │                                               │
│  ┌─────────────┐  │  ┌─────────────────────────────────────────┐ │
│  │   LOGO      │  │  │  HEADER (64px)                         │ │
│  │   Bauman    │  │  │  ┌─────────┐  ┌────────┐  ┌─────────┐  │ │
│  └─────────────┘  │  │  │ Breadcr │  │ Search │  │ Profile │  │ │
│                   │  │  └─────────┘  └────────┘  └─────────┘  │ │
│  ┌─────────────┐  │  └─────────────────────────────────────────┘ │
│  │ Dashboard   │  │                                               │
│  │ Clientes    │  │  ┌─────────────────────────────────────────┐ │
│  │ Tickets     │  │  │            PAGE CONTENT                 │ │
│  │ Obras       │  │  │                                         │ │
│  │ Finanzas    │  │  └─────────────────────────────────────────┘ │
│  └─────────────┘  │                                               │
└──────────────────────────────────────────────────────────────────┘
```

### Estructura Mobile

```
┌─────────────────────────┐
│ ☰  BAUMAN    🔔  👤    │  ← Header fijo
├─────────────────────────┤
│                         │
│    PAGE CONTENT         │
│    (full width)         │
│                         │
│                         │
└─────────────────────────┘
        │
        ▼ (Sheet desde izquierda)
┌─────────────────────────┐
│   Navigation Menu       │
│   - Dashboard           │
│   - Clientes            │
│   - Tickets...          │
└─────────────────────────┘
```

---

## � Tipografía

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Elemento | Size | Weight |
|----------|------|--------|
| H1 | `text-2xl` (24px) | 700 |
| H2 | `text-xl` (20px) | 600 |
| Body | `text-base` (16px) | 400 |
| Small | `text-sm` (14px) | 400 |
| Muted | `text-xs` (12px) | 400 |

---

## 🧩 Componentes

### shadcn/ui Config

```bash
npx shadcn-ui@latest init
# Base color: Zinc
# CSS Variables: Yes
# Dark mode: class
```

### Componentes Requeridos

Button, Input, Select, Textarea, Table, DataTable, Dialog, **Sheet** (mobile sidebar), Card, Badge, Tabs, Toast, Form, DropdownMenu, Command, Calendar, Avatar

### Iconos: Lucide React

```tsx
import { Home, Users, Ticket, Menu } from 'lucide-react';
```

---

## 🎭 Estados (Dual Mode)

### Tickets

| Estado | Light | Dark |
|--------|-------|------|
| Abierto | `bg-zinc-100 text-zinc-700` | `dark:bg-zinc-800 dark:text-zinc-300` |
| En Progreso | `bg-yellow-100 text-yellow-700` | `dark:bg-yellow-900/30 dark:text-yellow-400` |
| Resuelto | `bg-green-100 text-green-700` | `dark:bg-green-900/30 dark:text-green-400` |
| Cancelado | `bg-zinc-100 text-zinc-500` | `dark:bg-zinc-800 dark:text-zinc-500` |

### Prioridades

| Prioridad | Light | Dark |
|-----------|-------|------|
| Baja | `bg-zinc-100 text-zinc-600` | `dark:bg-zinc-800 dark:text-zinc-400` |
| Media | `bg-zinc-200 text-zinc-700` | `dark:bg-zinc-700 dark:text-zinc-300` |
| Alta | `bg-orange-100 text-orange-700` | `dark:bg-orange-900/30 dark:text-orange-400` |
| Urgente | `bg-red-100 text-red-700` | `dark:bg-red-900/30 dark:text-red-400` |

---

## ✅ Checklist Pre-Desarrollo

### Responsive
- [ ] Funciona en 375px (iPhone SE)
- [ ] Sidebar es Sheet en mobile
- [ ] Tablas tienen scroll horizontal
- [ ] Cards apilan en mobile
- [ ] Touch targets ≥ 44px

### Modos
- [ ] Todos los componentes tienen `dark:` classes
- [ ] Theme toggle implementado
- [ ] Colores usan CSS variables
- [ ] Contraste WCAG AA

### General
- [ ] No hay emojis como iconos
- [ ] Font Inter cargada
- [ ] shadcn/ui configurado con Zinc

---

## 🔄 Próximos Pasos

1. Diseño de modelo de datos (ERD)
2. Setup del proyecto con estructura definida
3. Implementar layout responsive con Sidebar/Sheet
4. Theme toggle (light/dark)
5. Módulo de Seguridad
