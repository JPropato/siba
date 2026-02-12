import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import type { CargaFormData } from '../types';

const cargaSchema = z.object({
  monto: z.string().min(1, 'El monto es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  descripcion: z.string().optional().or(z.literal('')),
  comprobante: z.string().optional().or(z.literal('')),
});

type CargaFormValues = z.infer<typeof cargaSchema>;

interface CargaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CargaFormData) => Promise<void>;
}

export default function CargaDialog({ isOpen, onClose, onSave }: CargaDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CargaFormValues>({
    resolver: zodResolver(cargaSchema),
    defaultValues: {
      monto: '',
      fecha: '',
      descripcion: '',
      comprobante: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        comprobante: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: CargaFormValues) => {
    try {
      await onSave({
        monto: Number(values.monto),
        fecha: values.fecha,
        descripcion: values.descripcion?.trim() || undefined,
        comprobante: values.comprobante?.trim() || undefined,
      });
      toast.success('Carga registrada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al registrar la carga');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Carga"
      description="Registre una carga de saldo en la tarjeta precargable."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="carga-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form id="carga-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('monto')}
            error={errors.monto?.message}
          />
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Fecha *"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.fecha?.message}
              />
            )}
          />
        </div>
        <Input
          label="Descripción"
          placeholder="Detalle de la carga..."
          {...register('descripcion')}
        />
        <Input
          label="Comprobante"
          placeholder="N° de comprobante o referencia..."
          {...register('comprobante')}
        />
      </form>
    </DialogBase>
  );
}
