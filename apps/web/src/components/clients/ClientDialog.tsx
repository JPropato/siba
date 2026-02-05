import { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import type { Cliente, ClienteFormData } from '../../types/client';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { cn } from '../../lib/utils';

const clientSchema = z.object({
  razonSocial: z.string().min(3, 'La razón social debe tener al menos 3 caracteres'),
  cuit: z
    .string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 11, {
      message: 'CUIT debe tener 11 dígitos',
    }),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  direccionFiscal: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClienteFormData) => Promise<void>;
  initialData?: Cliente | null;
}

export default function ClientDialog({ isOpen, onClose, onSave, initialData }: ClientDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      razonSocial: '',
      cuit: '',
      email: '',
      telefono: '',
      direccionFiscal: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          razonSocial: initialData.razonSocial,
          cuit: initialData.cuit || '',
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          direccionFiscal: initialData.direccionFiscal || '',
        });
      } else {
        reset({
          razonSocial: '',
          cuit: '',
          email: '',
          telefono: '',
          direccionFiscal: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      await onSave({
        ...values,
        cuit: values.cuit?.replace(/\D/g, '') || undefined,
        email: values.email || undefined,
        telefono: values.telefono || undefined,
        direccionFiscal: values.direccionFiscal || undefined,
      });
      toast.success(initialData ? 'Cliente actualizado' : 'Cliente creado correctamente');
      onClose();
    } catch (err: unknown) {
      console.error('Save error:', err);
      const axiosErr = err as {
        response?: { data?: { error?: string | Array<{ message: string }> } };
      };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.map((e: { message: string }) => e.message).join('. ')
        : backendError || 'Error al guardar el cliente';
      toast.error(message);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
      description="Complete los datos de la entidad fiscal."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Razón Social *"
          placeholder="Ej: Bauman S.A."
          {...register('razonSocial')}
          error={errors.razonSocial?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CUIT / ID Fiscal"
            placeholder="00-00000000-0"
            {...register('cuit')}
            error={errors.cuit?.message}
          />
          <Input
            label="Teléfono"
            placeholder="Ej: +54 9..."
            {...register('telefono')}
            error={errors.telefono?.message}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="ejemplo@correo.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Dirección Fiscal
          </label>
          <textarea
            {...register('direccionFiscal')}
            className={cn(
              'w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600',
              errors.direccionFiscal && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            placeholder="Calle, Número, Localidad..."
            rows={2}
          />
          {errors.direccionFiscal && (
            <p className="text-[11px] font-medium text-red-500 mt-1">
              {errors.direccionFiscal.message}
            </p>
          )}
        </div>
      </form>
    </DialogBase>
  );
}
