---
name: siba-notifications
description: Patrones para notificaciones, toasts y feedback visual en SIBA
---

# SIBA Notifications

Lineamientos para mostrar feedback al usuario con toasts, alertas y notificaciones.

## Cuándo Usar

- Mostrar **feedback de acciones** (éxito, error)
- Implementar **confirmaciones** antes de acciones destructivas
- Notificar **errores de API** de forma amigable

---

## Stack

| Herramienta       | Propósito        |
| ----------------- | ---------------- |
| `sonner`          | Toasts elegantes |
| Componente propio | Confirmaciones   |
| Error boundary    | Errores críticos |

---

## Toasts con Sonner

### Configuración

```tsx
// App.tsx o Layout.tsx
import { Toaster } from 'sonner';

export const App = () => (
  <>
    <Toaster position="top-right" richColors closeButton duration={4000} />
    {/* resto de la app */}
  </>
);
```

### Uso Básico

```tsx
import { toast } from 'sonner';

// ✅ Éxito
toast.success('Cliente creado correctamente');

// ❌ Error
toast.error('No se pudo guardar el registro');

// ⚠️ Warning
toast.warning('Este ticket ya fue asignado');

// ℹ️ Info
toast.info('Se encontraron 5 resultados');

// ⏳ Loading → Success/Error
const promise = api.post('/tickets', data);
toast.promise(promise, {
  loading: 'Guardando ticket...',
  success: 'Ticket creado exitosamente',
  error: 'Error al crear el ticket',
});
```

---

## Patrones por Acción

### CRUD Operations

```typescript
// Crear
const handleCreate = async (data: FormData) => {
  try {
    await api.post('/clientes', data);
    toast.success('Cliente creado correctamente');
    queryClient.invalidateQueries(['clientes']);
    onClose();
  } catch (error) {
    toast.error('Error al crear el cliente');
  }
};

// Actualizar
const handleUpdate = async (data: FormData) => {
  try {
    await api.put(`/clientes/${id}`, data);
    toast.success('Cambios guardados');
    queryClient.invalidateQueries(['clientes']);
  } catch (error) {
    toast.error('Error al guardar los cambios');
  }
};

// Eliminar (con confirmación)
const handleDelete = async () => {
  if (!(await confirm('¿Eliminar este cliente?'))) return;

  try {
    await api.delete(`/clientes/${id}`);
    toast.success('Cliente eliminado');
    queryClient.invalidateQueries(['clientes']);
  } catch (error) {
    toast.error('Error al eliminar');
  }
};
```

---

## Confirmación antes de Eliminar

```tsx
// components/ui/ConfirmDialog.tsx
import { DialogBase } from './core/DialogBase';
import { Button } from './core/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Eliminar',
  isLoading,
}: ConfirmDialogProps) => (
  <DialogBase
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    maxWidth="sm"
    icon={
      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
    }
    footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmText}
        </Button>
      </>
    }
  >
    <p className="text-slate-600 dark:text-slate-400">{message}</p>
  </DialogBase>
);
```

### Uso con Hook

```tsx
// hooks/useConfirm.ts
import { useState } from 'react';

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = (message?: string): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolver?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setIsOpen(false);
  };

  return { isOpen, confirm, handleConfirm, handleCancel };
};
```

---

## Mensajes Estándar

| Acción         | Mensaje Éxito                      | Mensaje Error                  |
| -------------- | ---------------------------------- | ------------------------------ |
| Crear          | `[Entidad] creado/a correctamente` | `Error al crear [entidad]`     |
| Actualizar     | `Cambios guardados`                | `Error al guardar los cambios` |
| Eliminar       | `[Entidad] eliminado/a`            | `Error al eliminar`            |
| Cambiar estado | `Estado actualizado`               | `Error al cambiar estado`      |
| Login          | `Bienvenido, [nombre]`             | `Credenciales inválidas`       |
| Logout         | (ninguno)                          | -                              |

---

## Errores de API Globales

```tsx
// lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Error de conexión';

    // No mostrar toast si el componente lo manejará
    if (!error.config?.skipToast) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Uso: auto-toast
await api.get('/endpoint');

// Uso: sin auto-toast (manejo custom)
await api.get('/endpoint', { skipToast: true });
```

---

## Checklist

- [ ] Sonner configurado en layout principal
- [ ] Toast success después de crear/actualizar
- [ ] Toast error en catch de API calls
- [ ] ConfirmDialog antes de eliminar
- [ ] Mensajes descriptivos y consistentes
- [ ] No duplicar toasts (interceptor + componente)
