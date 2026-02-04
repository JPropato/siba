---
name: siba-components
description: Lineamientos para crear y reutilizar componentes UI en el proyecto SIBA
---

# SIBA Components

Esta skill define los lineamientos para crear, organizar y reutilizar componentes UI en el proyecto SIBA.

## Cuándo Usar

Usa esta skill cuando:

- Crees un **nuevo componente UI** (botón, modal, formulario, etc.)
- Necesites **reutilizar** componentes existentes
- Refactorices componentes para mejorar consistencia

---

## Estructura de Archivos

```
apps/web/src/components/
├── ui/                    # Componentes base reutilizables
│   ├── core/              # Primitivos (Button, Input, Select, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── DialogBase.tsx
│   │   └── ...
│   ├── EmptyState.tsx
│   └── Sheet.tsx
├── layout/                # Componentes de estructura
├── tickets/               # Componentes específicos de tickets
├── sedes/                 # Componentes específicos de sedes
└── [feature]/             # Componentes por feature/módulo
```

---

## Lineamientos de Creación

### 1. Estructura Básica de un Componente

```tsx
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../../lib/utils';

// 1. Definir interface de props extendiendo de HTML cuando aplique
interface MiComponenteProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
}

// 2. Usar forwardRef para componentes interactivos
export const MiComponente = forwardRef<HTMLDivElement, MiComponenteProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    // 3. Definir variantes como objetos
    const variants = {
      primary: 'bg-brand text-white',
      secondary: 'bg-slate-100 text-slate-900',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <div
        ref={ref}
        // 4. Usar cn() para combinar clases
        className={cn(
          'base-styles here',
          variants[variant],
          sizes[size],
          className // Siempre permitir override
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

// 5. Asignar displayName
MiComponente.displayName = 'MiComponente';
```

### 2. Convenciones de Naming

| Tipo            | Convención          | Ejemplo                          |
| --------------- | ------------------- | -------------------------------- |
| Archivo         | `PascalCase.tsx`    | `Button.tsx`, `DialogBase.tsx`   |
| Componente      | `PascalCase`        | `export const Button = ...`      |
| Props interface | `[Componente]Props` | `ButtonProps`, `DialogBaseProps` |
| Variantes       | `camelCase`         | `variant`, `size`, `isLoading`   |

### 3. Props Estándar

Siempre incluir cuando aplique:

```tsx
interface Props {
  variant?: '...' | '...'; // Estilo visual
  size?: 'sm' | 'md' | 'lg'; // Tamaño
  isLoading?: boolean; // Estado de carga
  disabled?: boolean; // Deshabilitado
  className?: string; // Override de estilos
  leftIcon?: ReactNode; // Ícono izquierdo
  rightIcon?: ReactNode; // Ícono derecho
}
```

---

## Lineamientos de Reutilización

### 1. Usar Componentes Core Existentes

Antes de crear, verificar si existe en `components/ui/core/`:

| Necesitas         | Usa                                     |
| ----------------- | --------------------------------------- |
| Botón             | `Button` desde `ui/core/Button`         |
| Campo de texto    | `Input` desde `ui/core/Input`           |
| Modal/Dialog      | `DialogBase` desde `ui/core/DialogBase` |
| Selector          | `Select` desde `ui/core/Select`         |
| Combobox          | `Combobox` desde `ui/core/Combobox`     |
| Selector de fecha | `DatePicker` desde `ui/core/DatePicker` |
| Panel lateral     | `Sheet` desde `ui/Sheet`                |
| Estado vacío      | `EmptyState` desde `ui/EmptyState`      |

### 2. Composición de Componentes

Preferir composición sobre props complejas:

```tsx
// ✅ CORRECTO - Composición
<DialogBase
    isOpen={isOpen}
    onClose={onClose}
    title="Crear Usuario"
    description="Completa los datos del nuevo usuario"
    footer={
        <>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar</Button>
        </>
    }
>
    <FormularioUsuario />
</DialogBase>

// ❌ EVITAR - Props excesivas
<DialogBase
    isOpen={isOpen}
    onClose={onClose}
    cancelText="Cancelar"
    confirmText="Guardar"
    onCancel={onClose}
    onConfirm={handleSubmit}
    formComponent={FormularioUsuario}
/>
```

### 3. Extender con Wrapper

Para agregar funcionalidad a componentes existentes:

```tsx
// Wrapper que extiende DialogBase para confirmación
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  onConfirm,
  message,
  isLoading,
  ...dialogProps
}: ConfirmDialogProps) => (
  <DialogBase
    {...dialogProps}
    maxWidth="sm"
    footer={
      <>
        <Button variant="ghost" onClick={dialogProps.onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
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

## Checklist Antes de Crear

- [ ] ¿Existe un componente similar en `ui/core/`?
- [ ] ¿Puedo extender uno existente con `wrapper`?
- [ ] ¿Usé el patrón de variantes y sizes?
- [ ] ¿Permite override con `className`?
- [ ] ¿Tiene `displayName` asignado?
- [ ] ¿Usa `forwardRef` si es interactivo?
- [ ] ¿Soporta dark mode?

---

## Estilos y Clases

### Paleta de Colores Brand

```tsx
// Primarios
'bg-brand'; // Fondo primario
'text-brand'; // Texto primario
'hover:bg-brand-dark';

// Estados
'bg-red-500'; // Danger
'bg-green-500'; // Success
'bg-yellow-500'; // Warning

// Neutrales (soporte dark mode)
'bg-slate-100 dark:bg-slate-800';
'text-slate-900 dark:text-white';
'border-slate-200 dark:border-slate-800';
```

### Animaciones Estándar

```tsx
// Entrada
'animate-in fade-in duration-300';
'animate-in zoom-in-95 fade-in duration-300';

// Interacción
'transition-all';
'active:scale-[0.98]';
'hover:shadow-brand/20';
```

---

## Ejemplos Rápidos

### Crear un Componente Feature

```tsx
// components/tickets/TicketCard.tsx
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/core/Button';

interface TicketCardProps {
  ticket: Ticket;
  onView: () => void;
}

export const TicketCard = ({ ticket, onView }: TicketCardProps) => (
  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
    <h3 className="font-semibold">{ticket.titulo}</h3>
    <Badge variant={ticket.estado}>{ticket.estado}</Badge>
    <Button variant="ghost" size="sm" onClick={onView}>
      Ver detalles
    </Button>
  </div>
);
```

### Extender Componente Existente

```tsx
// Botón con ícono predefinido
import { Plus } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/core/Button';

export const AddButton = (props: Omit<ButtonProps, 'leftIcon'>) => (
  <Button leftIcon={<Plus className="h-4 w-4" />} {...props} />
);
```
