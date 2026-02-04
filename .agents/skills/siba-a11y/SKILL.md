---
name: siba-a11y
description: Lineamientos de accesibilidad para interfaces inclusivas
---

# SIBA Accessibility (a11y)

Lineamientos para crear interfaces accesibles para todos los usuarios.

## Cuándo Usar

- Crear **componentes interactivos**
- Implementar **formularios**
- Manejar **focus** y navegación por teclado
- Agregar **ARIA** labels

---

## Principios WCAG

| Principio        | Significado                          |
| ---------------- | ------------------------------------ |
| **Perceptible**  | La información debe poder percibirse |
| **Operable**     | La UI debe poder operarse            |
| **Comprensible** | La información debe entenderse       |
| **Robusto**      | Compatible con tecnología asistiva   |

---

## Semántica HTML

```tsx
// ✅ CORRECTO - Semántico
<nav aria-label="Navegación principal">
    <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/tickets">Tickets</a></li>
    </ul>
</nav>

<main>
    <h1>Gestión de Tickets</h1>
    <section aria-labelledby="filtros-heading">
        <h2 id="filtros-heading">Filtros</h2>
        ...
    </section>
</main>

// ❌ EVITAR - Divs genéricos
<div class="nav">
    <div onclick="...">Dashboard</div>
</div>
```

---

## Navegación por Teclado

### Focus Visible

```css
/* Siempre mostrar focus visible */
:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

/* NO hacer esto */
:focus {
  outline: none; /* ❌ Nunca quitar outline sin reemplazo */
}
```

### Tab Order

```tsx
// Orden lógico de tabulación
<form>
  <Input label="Nombre" tabIndex={0} /> {/* Default */}
  <Input label="Email" tabIndex={0} />
  <Button tabIndex={0}>Enviar</Button>
  {/* Skip elements decorativos */}
  <Icon tabIndex={-1} />
</form>
```

### Focus Trap en Modales

```tsx
// El componente DialogBase de SIBA ya maneja esto
// Si crean modales custom, usar:
import { useFocusTrap } from '@/hooks/useFocusTrap';

const Modal = ({ isOpen, children }) => {
  const ref = useFocusTrap(isOpen);

  return (
    <div ref={ref} role="dialog" aria-modal="true">
      {children}
    </div>
  );
};
```

---

## Formularios Accesibles

```tsx
// ✅ Labels asociados correctamente
<div className="space-y-2">
    <label htmlFor="email" className="text-sm font-medium">
        Email
        <span className="text-red-500" aria-hidden="true">*</span>
    </label>
    <input
        id="email"
        type="email"
        aria-required="true"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'email-error' : undefined}
    />
    {errors.email && (
        <p id="email-error" role="alert" className="text-red-500 text-sm">
            {errors.email.message}
        </p>
    )}
</div>

// Componente Input de SIBA ya incluye esto
<Input
    label="Email"
    required
    error={errors.email?.message}
    {...register('email')}
/>
```

---

## ARIA Attributes

### Estados

```tsx
// Botón con estado de carga
<button
    aria-busy={isLoading}
    aria-disabled={isLoading}
    disabled={isLoading}
>
    {isLoading ? 'Guardando...' : 'Guardar'}
</button>

// Checkbox
<input
    type="checkbox"
    aria-checked={checked}
    aria-label="Seleccionar ticket"
/>

// Expandible
<button aria-expanded={isOpen} aria-controls="panel-1">
    Ver más
</button>
<div id="panel-1" hidden={!isOpen}>
    Contenido expandido
</div>
```

### Live Regions

```tsx
// Anunciar cambios dinámicos
<div aria-live="polite" aria-atomic="true" className="sr-only">
    {notification}
</div>

// Para errores urgentes
<div role="alert" aria-live="assertive">
    {error}
</div>
```

---

## Imágenes y Media

```tsx
// Imágenes informativas
<img src="logo.png" alt="Logo de SIBA" />

// Imágenes decorativas
<img src="pattern.png" alt="" aria-hidden="true" />

// Iconos con acción
<button aria-label="Eliminar ticket">
    <TrashIcon aria-hidden="true" />
</button>

// Iconos informativos
<span aria-label="Estado: Finalizado">
    <CheckIcon aria-hidden="true" />
</span>
```

---

## Colores y Contraste

```tsx
// Ratio mínimo de contraste
// - Texto normal: 4.5:1
// - Texto grande (18px+): 3:1
// - UI components: 3:1

// ✅ No depender solo de color
<Badge className="bg-red-500">
    <XIcon aria-hidden="true" /> {/* Icono además del color */}
    Rechazado
</Badge>

// ❌ Solo color
<span className="text-red-500">Error</span> {/* No accesible */}
```

---

## Screen Reader Only

```css
/* Clase para contenido solo para lectores de pantalla */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```tsx
// Uso
<button>
  <TrashIcon />
  <span className="sr-only">Eliminar ticket</span>
</button>
```

---

## Componentes Radix (ya accesibles)

Los componentes de Radix UI que usamos ya tienen accesibilidad:

- `@radix-ui/react-dialog` - Modales
- `@radix-ui/react-select` - Selects
- `@radix-ui/react-dropdown-menu` - Menús
- `@radix-ui/react-tabs` - Tabs
- `@radix-ui/react-tooltip` - Tooltips

---

## Checklist

- [ ] HTML semántico (`<nav>`, `<main>`, `<section>`, etc.)
- [ ] Labels asociados a todos los inputs
- [ ] `alt` en imágenes informativas
- [ ] `aria-label` en botones con solo iconos
- [ ] Focus visible en todos los interactivos
- [ ] Contraste mínimo 4.5:1 para texto
- [ ] No depender solo de color para información
- [ ] `role="alert"` para mensajes de error
- [ ] Focus trap en modales
- [ ] Navegable por teclado
