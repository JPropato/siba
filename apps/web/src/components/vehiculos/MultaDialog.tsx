import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { DatePicker } from '../ui/core/DatePicker';
import type {
  MultaVehiculo,
  MultaVehiculoFormData,
  EstadoMultaVehiculo,
} from '../../types/vehiculos';

const multaSchema = z.object({
  tipo: z.enum(['ARBA_PATENTE', 'INFRACCION_CABA', 'INFRACCION_PROVINCIA']),
  fecha: z.string().min(1, 'La fecha es requerida'),
  monto: z.string().min(1, 'El monto es requerido'),
  numeroActa: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  estado: z.enum(['PENDIENTE', 'PAGADA', 'EN_GESTION']).optional(),
  fechaPago: z.string().optional().or(z.literal('')),
});

type MultaFormValues = z.infer<typeof multaSchema>;

interface MultaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: MultaVehiculoFormData & { estado?: EstadoMultaVehiculo; fechaPago?: string | null }
  ) => Promise<void>;
  initialData?: MultaVehiculo | null;
  vehiculoId: number;
}

export default function MultaDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  vehiculoId,
}: MultaDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MultaFormValues>({
    resolver: zodResolver(multaSchema),
    defaultValues: {
      tipo: 'ARBA_PATENTE',
      fecha: '',
      monto: '',
      numeroActa: '',
      descripcion: '',
      observaciones: '',
      estado: 'PENDIENTE',
      fechaPago: '',
    },
  });

  const estado = watch('estado');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          tipo: initialData.tipo,
          fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : '',
          monto: initialData.monto?.toString() || '',
          numeroActa: initialData.numeroActa || '',
          descripcion: initialData.descripcion || '',
          observaciones: initialData.observaciones || '',
          estado: initialData.estado,
          fechaPago: initialData.fechaPago
            ? new Date(initialData.fechaPago).toISOString().split('T')[0]
            : '',
        });
      } else {
        reset({
          tipo: 'ARBA_PATENTE',
          fecha: '',
          monto: '',
          numeroActa: '',
          descripcion: '',
          observaciones: '',
          estado: 'PENDIENTE',
          fechaPago: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: MultaFormValues) => {
    try {
      await onSave({
        vehiculoId,
        tipo: values.tipo,
        fecha: values.fecha,
        monto: Number(values.monto),
        numeroActa: values.numeroActa?.trim() || null,
        descripcion: values.descripcion?.trim() || null,
        observaciones: values.observaciones?.trim() || null,
        ...(initialData && {
          estado: values.estado as EstadoMultaVehiculo,
          fechaPago: values.fechaPago || null,
        }),
      });
      toast.success(initialData ? 'Multa actualizada' : 'Multa registrada');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al guardar multa');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Multa' : 'Nueva Multa'}
      description="Registre una multa o infracción del vehículo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="multa-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form id="multa-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo *"
                options={[
                  { value: 'ARBA_PATENTE', label: 'ARBA Patente' },
                  { value: 'INFRACCION_CABA', label: 'Infracción CABA' },
                  { value: 'INFRACCION_PROVINCIA', label: 'Infracción Provincia' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <DatePicker label="Fecha *" value={field.value || ''} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('monto')}
            error={errors.monto?.message}
          />
          <Input label="N° Acta" placeholder="Opcional" {...register('numeroActa')} />
        </div>
        <Input
          label="Descripción"
          placeholder="Detalle de la multa..."
          {...register('descripcion')}
        />
        {initialData && (
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select
                  label="Estado"
                  options={[
                    { value: 'PENDIENTE', label: 'Pendiente' },
                    { value: 'EN_GESTION', label: 'En gestión' },
                    { value: 'PAGADA', label: 'Pagada' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {estado === 'PAGADA' && (
              <Controller
                name="fechaPago"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Fecha de Pago"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </div>
        )}
        <Input
          label="Observaciones"
          placeholder="Notas adicionales..."
          {...register('observaciones')}
        />
      </form>
    </DialogBase>
  );
}
