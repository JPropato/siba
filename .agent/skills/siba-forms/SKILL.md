---
name: siba-forms
description: Patrón estándar para formularios en SIBA usando React Hook Form + Zod + DialogBase
---

# SIBA Forms

Lineamientos para crear formularios consistentes usando React Hook Form, Zod y los componentes UI de SIBA.

## Cuándo Usar

Usa esta skill cuando:

- Crees un **formulario de creación/edición** en un modal
- Necesites **validación** en tiempo real
- Integres formularios con la **API**

---

## Stack de Formularios

| Herramienta             | Propósito              |
| ----------------------- | ---------------------- |
| `react-hook-form`       | Control del form state |
| `@hookform/resolvers`   | Integración con Zod    |
| `zod`                   | Validación de schema   |
| `DialogBase`            | Modal contenedor       |
| `Input`, `Select`, etc. | Inputs                 |

---

## Patrón Completo

### 1. Definir Schema Zod

```typescript
// schemas/cliente.schema.ts
import { z } from 'zod';

export const clienteSchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  cuit: z
    .string()
    .regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
```

### 2. Componente Formulario

```tsx
// components/clients/ClienteForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogBase } from '@/components/ui/core/DialogBase';
import { Input } from '@/components/ui/core/Input';
import { Button } from '@/components/ui/core/Button';
import { clienteSchema, type ClienteFormData } from '@/schemas/cliente.schema';

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => Promise<void>;
  initialData?: Partial<ClienteFormData>;
  isEditing?: boolean;
}

export const ClienteForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: ClienteFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(initialData || {});
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data: ClienteFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      description="Complete los datos del cliente"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting}>
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="Razón Social"
          {...register('razonSocial')}
          error={errors.razonSocial?.message}
          required
        />

        <Input
          label="CUIT"
          {...register('cuit')}
          error={errors.cuit?.message}
          placeholder="Sin guiones"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Teléfono" {...register('telefono')} />
        </div>
      </form>
    </DialogBase>
  );
};
```

---

## Convenciones de Layout

### Grid para Campos

```tsx
// 2 columnas
<div className="grid grid-cols-2 gap-4">
    <Input label="Nombre" {...register('nombre')} />
    <Input label="Apellido" {...register('apellido')} />
</div>

// 3 columnas
<div className="grid grid-cols-3 gap-4">
    <Input label="Día" />
    <Input label="Mes" />
    <Input label="Año" />
</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    ...
</div>
```

### Secciones con Títulos

```tsx
<div className="space-y-6">
  {/* Sección 1 */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Datos Personales</h3>
    <Input label="Nombre" {...register('nombre')} />
  </div>

  {/* Divider */}
  <hr className="border-slate-200 dark:border-slate-700" />

  {/* Sección 2 */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Datos de Contacto</h3>
    <Input label="Email" {...register('email')} />
  </div>
</div>
```

---

## Validaciones Comunes

```typescript
// CUIT argentino
cuit: z.string().regex(/^\d{11}$/, 'CUIT debe tener 11 dígitos');

// Email opcional pero válido si se ingresa
email: z.string().email('Email inválido').optional().or(z.literal(''));

// Campo requerido
nombre: z.string().min(1, 'Campo requerido');

// Número positivo
cantidad: z.number().int().positive('Debe ser mayor a 0');

// Fecha futura
fechaProgramada: z.string()
  .datetime()
  .refine((val) => new Date(val) > new Date(), 'La fecha debe ser futura');

// Enum
estado: z.enum(['ACTIVO', 'INACTIVO']);

// Select con ID
clienteId: z.number().int().positive('Seleccione un cliente');
```

---

## Integración con API

```tsx
// Uso del form en una página
const ClientesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: ClienteFormData) => {
    if (editingCliente) {
      await api.put(`/clientes/${editingCliente.id}`, data);
    } else {
      await api.post('/clientes', data);
    }
    queryClient.invalidateQueries(['clientes']);
    toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente creado');
  };

  return (
    <>
      <Button onClick={() => setIsFormOpen(true)}>Nuevo Cliente</Button>

      <ClienteForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCliente(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCliente ?? undefined}
        isEditing={!!editingCliente}
      />
    </>
  );
};
```

---

## Checklist

- [ ] Schema Zod separado en `/schemas`
- [ ] Usar `zodResolver` con `react-hook-form`
- [ ] Reset form cuando `isOpen` cambia
- [ ] Mostrar errores bajo cada input
- [ ] Footer con botones Cancelar/Guardar
- [ ] `isLoading` en botón submit
- [ ] `maxWidth` apropiado en DialogBase
- [ ] Labels descriptivos en cada campo
