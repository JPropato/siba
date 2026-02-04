---
name: siba-responsive
description: Patrones de diseño responsive y mobile-first para SIBA
---

# SIBA Responsive

Lineamientos para crear interfaces que funcionen en todos los dispositivos.

## Cuándo Usar

- Diseñar **layouts adaptables**
- Implementar **breakpoints** correctamente
- Crear **navegación mobile**
- Optimizar **tablas** para pantallas pequeñas

---

## Breakpoints (Tailwind)

| Nombre    | Mínimo | Dispositivo      | Uso                    |
| --------- | ------ | ---------------- | ---------------------- |
| (default) | 0px    | Mobile           | Base                   |
| `sm`      | 640px  | Mobile landscape | -                      |
| `md`      | 768px  | Tablet           | Cambios significativos |
| `lg`      | 1024px | Desktop          | Layout completo        |
| `xl`      | 1280px | Desktop grande   | Extra espacio          |
| `2xl`     | 1536px | Ultra wide       | Máximos                |

---

## Mobile-First Approach

```tsx
// ✅ CORRECTO - Mobile first
<div className="
    flex flex-col          // Mobile: columna
    md:flex-row            // Tablet+: fila
    gap-4
">

// ❌ EVITAR - Desktop first
<div className="
    flex-row               // Asume desktop
    max-md:flex-col        // "Arregla" mobile
">
```

---

## Layouts Comunes

### Sidebar + Content

```tsx
// Layout principal con sidebar
<div className="flex min-h-screen">
  {/* Sidebar - oculto en mobile */}
  <aside
    className="
        hidden lg:flex              // Solo visible en desktop
        w-64 
        flex-col 
        border-r
    "
  >
    <Navigation />
  </aside>

  {/* Content - ancho completo en mobile */}
  <main
    className="
        flex-1 
        p-4 md:p-6 lg:p-8          // Padding progresivo
    "
  >
    {children}
  </main>
</div>;

{
  /* Mobile nav - solo visible en mobile */
}
<nav
  className="
    fixed bottom-0 left-0 right-0
    lg:hidden                       // Oculto en desktop
    bg-white border-t
    flex justify-around
    py-2
"
>
  <MobileNavItems />
</nav>;
```

### Grid de Cards

```tsx
<div
  className="
    grid 
    grid-cols-1              // Mobile: 1 columna
    sm:grid-cols-2           // Tablet: 2 columnas
    lg:grid-cols-3           // Desktop: 3 columnas
    xl:grid-cols-4           // Grande: 4 columnas
    gap-4 md:gap-6
"
>
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Form Layout

```tsx
<form className="space-y-4 md:space-y-6">
  {/* Campos en columna en mobile, fila en desktop */}
  <div
    className="
        grid 
        grid-cols-1 md:grid-cols-2 
        gap-4
    "
  >
    <Input label="Nombre" {...register('nombre')} />
    <Input label="Apellido" {...register('apellido')} />
  </div>

  {/* Campo full width */}
  <Input label="Email" {...register('email')} />

  {/* 3 columnas en desktop */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input label="Teléfono" />
    <Input label="Celular" />
    <Input label="Fax" />
  </div>
</form>
```

---

## Tablas Responsive

### Opción 1: Scroll Horizontal

```tsx
<div className="overflow-x-auto -mx-4 md:mx-0">
  <table className="min-w-full">{/* Tabla normal, scroll en mobile */}</table>
</div>
```

### Opción 2: Cards en Mobile

```tsx
{
  /* Desktop: Tabla */
}
<table className="hidden md:table w-full">
  <thead>...</thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{item.nombre}</td>
        <td>{item.email}</td>
        <td>{item.estado}</td>
      </tr>
    ))}
  </tbody>
</table>;

{
  /* Mobile: Cards */
}
<div className="md:hidden space-y-4">
  {items.map((item) => (
    <div key={item.id} className="p-4 border rounded-lg">
      <h3 className="font-semibold">{item.nombre}</h3>
      <p className="text-sm text-slate-500">{item.email}</p>
      <Badge>{item.estado}</Badge>
    </div>
  ))}
</div>;
```

### Opción 3: Columnas Prioritarias

```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>Nombre</th>
      <th className="hidden sm:table-cell">Email</th>
      <th className="hidden md:table-cell">Teléfono</th>
      <th className="hidden lg:table-cell">Fecha</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>{/* Misma lógica en celdas */}</tbody>
</table>
```

---

## Navegación Mobile

### Hamburger Menu

```tsx
const [isMenuOpen, setIsMenuOpen] = useState(false);

return (
  <header className="flex items-center justify-between p-4 lg:hidden">
    <Logo />
    <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-expanded={isMenuOpen} aria-label="Menú">
      {isMenuOpen ? <X /> : <Menu />}
    </button>

    {/* Drawer */}
    {isMenuOpen && (
      <div
        className="
                fixed inset-0 top-16 
                bg-white z-50
                p-4
            "
      >
        <nav className="flex flex-col gap-2">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
        </nav>
      </div>
    )}
  </header>
);
```

### Bottom Navigation

```tsx
<nav
  className="
    fixed bottom-0 left-0 right-0
    lg:hidden
    bg-white border-t
    flex justify-around items-center
    h-16
    z-50
"
>
  <NavItem to="/dashboard" icon={Home} label="Inicio" />
  <NavItem to="/tickets" icon={Ticket} label="Tickets" />
  <NavItem to="/clientes" icon={Users} label="Clientes" />
  <NavItem to="/perfil" icon={User} label="Perfil" />
</nav>;

{
  /* Agregar padding-bottom al contenido */
}
<main className="pb-20 lg:pb-0">{children}</main>;
```

---

## Modales Responsive

```tsx
<DialogBase
  maxWidth="lg"
  className="
        max-h-[90vh]           // Limitar altura
        md:max-h-[80vh]
    "
>
  <div
    className="
        overflow-y-auto        // Scroll interno
        max-h-[60vh]
        md:max-h-[50vh]
    "
  >
    {/* Contenido largo */}
  </div>
</DialogBase>
```

---

## Texto Responsive

```tsx
// Títulos
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
    Gestión de Tickets
</h1>

// Párrafos
<p className="text-sm md:text-base">
    Contenido normal
</p>

// Truncar en mobile
<span className="truncate max-w-[200px] md:max-w-none">
    Texto muy largo que se corta en mobile
</span>
```

---

## Espaciado Responsive

```tsx
// Margins y paddings
<div className="p-4 md:p-6 lg:p-8">
<div className="my-4 md:my-6 lg:my-8">
<div className="gap-2 md:gap-4 lg:gap-6">

// Secciones
<section className="py-8 md:py-12 lg:py-16">
```

---

## Testing Responsive

```bash
# Chrome DevTools
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Probar: iPhone SE, iPad, Desktop

# Breakpoints críticos a probar:
- 375px  (iPhone SE)
- 768px  (iPad)
- 1024px (Desktop)
- 1280px (Desktop grande)
```

---

## Checklist

- [ ] Layout mobile-first
- [ ] Sidebar oculto en mobile, bottom nav visible
- [ ] Tablas con scroll o cards alternativas
- [ ] Forms con grid responsive
- [ ] Modales con max-height y scroll
- [ ] Texto con tamaños adaptativos
- [ ] Probar en dispositivos reales
- [ ] Touch targets mínimo 44x44px
