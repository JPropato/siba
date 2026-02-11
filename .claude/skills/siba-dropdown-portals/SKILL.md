---
name: siba-dropdown-portals
description: Patron obligatorio para dropdowns, calendarios y popovers que usan createPortal con posicion fija. Previene flash en top-left y agrega animacion de salida suave.
---

# SIBA Dropdown Portals

Patron estandar para componentes overlay (Select, Combobox, DatePicker, etc.) que renderizan un dropdown via `createPortal` con `position: fixed`.

## Cuando Usar

Usa esta skill cuando:

- Crees un **nuevo componente** que renderiza un dropdown/popover/calendario via portal
- Modifiques un componente existente que usa `createPortal` con posicionamiento fijo
- Debuggees un dropdown que aparece brevemente en la esquina superior izquierda

---

## Componentes que Usan este Patron

| Componente | Archivo                             | Estado var    |
| ---------- | ----------------------------------- | ------------- |
| Select     | `components/ui/core/Select.tsx`     | `dropdownPos` |
| Combobox   | `components/ui/core/Combobox.tsx`   | `dropdownPos` |
| DatePicker | `components/ui/core/DatePicker.tsx` | `calendarPos` |

---

## El Bug: Flash en Top-Left

### Causa Raiz

Si `dropdownPos` se inicializa con valores numericos (`{top: 0, left: 0, width: 0}`), el portal se renderiza en la esquina superior izquierda durante 1 frame antes de que `useLayoutEffect` calcule la posicion correcta.

```tsx
// MAL - causa flash en (0,0)
const [dropdownPos, setDropdownPos] = useState({
  top: 0, bottom: 0, left: 0, width: 0, openUp: false,
});

// Portal se renderiza inmediatamente en top:0, left:0
{isOpen && createPortal(<div style={{ position: 'fixed', left: dropdownPos.left, ... }}>...}
```

### Solucion

Inicializar en `null` y condicionar el render del portal:

```tsx
// BIEN - no renderiza hasta tener posicion
const [dropdownPos, setDropdownPos] = useState<{
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUp: boolean;
} | null>(null);

// Portal solo se renderiza cuando dropdownPos !== null
{(isOpen || isClosing) && dropdownPos && createPortal(...)}
```

---

## Patron Completo

### 1. Estado Inicial

```tsx
const [isOpen, setIsOpen] = useState(false);
const [isClosing, setIsClosing] = useState(false);
const closingTimer = useRef<ReturnType<typeof setTimeout>>(null);
const containerRef = useRef<HTMLDivElement>(null);
const dropdownRef = useRef<HTMLDivElement>(null);

// CRITICO: inicializar en null, NO en {top: 0, left: 0, ...}
const [dropdownPos, setDropdownPos] = useState<{
  top: number;
  bottom: number;
  left: number;
  width: number;
  openUp: boolean;
} | null>(null);
```

### 2. Cierre Suave con Animacion de Salida

```tsx
const closeDropdown = useCallback(() => {
  setIsClosing(true);
  closingTimer.current = setTimeout(() => {
    setIsOpen(false);
    setIsClosing(false);
    setDropdownPos(null); // Reset para el proximo open
  }, 100); // 100ms para la animacion de salida
}, []);

// Limpiar timer al desmontar
useEffect(() => {
  return () => {
    if (closingTimer.current) clearTimeout(closingTimer.current);
  };
}, []);
```

### 3. Calculo de Posicion (useLayoutEffect)

```tsx
useLayoutEffect(() => {
  if (!isOpen || !containerRef.current) return;
  const update = () => {
    const rect = containerRef.current!.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const maxH = 288; // Altura maxima del dropdown
    const openUp = spaceBelow < maxH && rect.top > spaceBelow;
    setDropdownPos({
      top: rect.bottom + 8,
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  };
  update();
  window.addEventListener('scroll', update, true);
  window.addEventListener('resize', update);
  return () => {
    window.removeEventListener('scroll', update, true);
    window.removeEventListener('resize', update);
  };
}, [isOpen]);
```

### 4. Click Outside

```tsx
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      containerRef.current &&
      !containerRef.current.contains(target) &&
      (!dropdownRef.current || !dropdownRef.current.contains(target))
    ) {
      closeDropdown(); // NO setIsOpen(false)
    }
  };
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, closeDropdown]);
```

### 5. Portal con Animaciones

```tsx
{
  (isOpen || isClosing) &&
    dropdownPos &&
    createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          left: dropdownPos.left,
          width: dropdownPos.width || undefined,
          ...(dropdownPos.openUp ? { bottom: dropdownPos.bottom } : { top: dropdownPos.top }),
        }}
        className={cn(
          'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[9999]',
          isClosing ? 'animate-out fade-out duration-100' : 'animate-in fade-in duration-150'
        )}
      >
        {/* Contenido del dropdown */}
      </div>,
      document.body
    );
}
```

---

## Reglas Importantes

1. **NUNCA** inicializar `dropdownPos` con valores numericos - siempre `null`
2. **NUNCA** usar `setIsOpen(false)` directo - siempre pasar por `closeDropdown()`
3. **SIEMPRE** resetear `dropdownPos` a `null` en el cierre
4. **SIEMPRE** condicionar el portal con `dropdownPos &&`
5. Usar `duration-100` para salida y `duration-150` para entrada (valores validos de Tailwind)
6. El `z-index` del dropdown debe ser `z-[9999]` para estar sobre DialogBase (`z-[200]`) y Sheet (`z-50`)
7. Usar `useLayoutEffect` (no `useEffect`) para el calculo de posicion para evitar flicker
8. Registrar listeners de `scroll` (con `true` para capture) y `resize` para mantener posicion actualizada

---

## Checklist

- [ ] `dropdownPos` inicializado en `null`
- [ ] Portal condicionado con `dropdownPos &&`
- [ ] `closeDropdown()` con `isClosing` state y `setTimeout(100)`
- [ ] Todos los cierres usan `closeDropdown()`, no `setIsOpen(false)`
- [ ] `dropdownPos` reseteado a `null` en `closeDropdown`
- [ ] Timer limpiado en cleanup del `useEffect`
- [ ] Animacion entrada: `animate-in fade-in duration-150`
- [ ] Animacion salida: `animate-out fade-out duration-100`
- [ ] `useLayoutEffect` para calculo de posicion
- [ ] Listeners de `scroll` (capture) y `resize`
