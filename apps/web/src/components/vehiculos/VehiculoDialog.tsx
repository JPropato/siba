import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Vehiculo, VehiculoFormData } from '../../types/vehiculos';
import type { Zona } from '../../types/zona';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { DatePicker } from '../ui/core/DatePicker';
import { Activity, Car, MapPin, Wrench, ShieldCheck } from 'lucide-react';

const vehiculoSchema = z.object({
  patente: z.string().min(1, 'La patente es requerida'),
  marca: z.string().optional().or(z.literal('')),
  modelo: z.string().optional().or(z.literal('')),
  anio: z.string().optional().or(z.literal('')),
  tipo: z.string().optional().or(z.literal('')),
  zonaId: z.string().optional().or(z.literal('')),
  proximosKm: z.string().optional().or(z.literal('')),
  proximoService: z.string().optional().or(z.literal('')),
  fechaVencimientoVTV: z.string().optional().or(z.literal('')),
  estado: z.enum(['ACTIVO', 'TALLER', 'FUERA_SERVICIO']),
});

type VehiculoFormValues = z.infer<typeof vehiculoSchema>;

interface VehiculoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehiculoFormData) => Promise<void>;
  initialData?: Vehiculo | null;
}

export default function VehiculoDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: VehiculoDialogProps) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isFetchingZonas, setIsFetchingZonas] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      tipo: '',
      zonaId: '',
      proximosKm: '',
      proximoService: '',
      fechaVencimientoVTV: '',
      estado: 'ACTIVO',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchZonas = async () => {
        setIsFetchingZonas(true);
        try {
          const res = await api.get('/zones?limit=100');
          setZonas(res.data.data || []);
        } catch (err) {
          console.error('Error fetching zones:', err);
        } finally {
          setIsFetchingZonas(false);
        }
      };
      fetchZonas();

      if (initialData) {
        reset({
          patente: initialData.patente,
          marca: initialData.marca || '',
          modelo: initialData.modelo || '',
          anio: initialData.anio?.toString() || '',
          tipo: initialData.tipo || '',
          zonaId: initialData.zonaId?.toString() || '',
          proximosKm: initialData.proximosKm?.toString() || '',
          proximoService: initialData.proximoService
            ? new Date(initialData.proximoService).toISOString().split('T')[0]
            : '',
          fechaVencimientoVTV: initialData.fechaVencimientoVTV
            ? new Date(initialData.fechaVencimientoVTV).toISOString().split('T')[0]
            : '',
          estado: initialData.estado || 'ACTIVO',
        });
      } else {
        reset({
          patente: '',
          marca: '',
          modelo: '',
          anio: '',
          tipo: '',
          zonaId: '',
          proximosKm: '',
          proximoService: '',
          fechaVencimientoVTV: '',
          estado: 'ACTIVO',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: VehiculoFormValues) => {
    try {
      await onSave({
        patente: values.patente.trim().toUpperCase(),
        marca: values.marca?.trim() || undefined,
        modelo: values.modelo?.trim() || undefined,
        anio: values.anio ? Number(values.anio) : undefined,
        tipo: values.tipo?.trim() || undefined,
        zonaId: values.zonaId ? Number(values.zonaId) : undefined,
        proximosKm: values.proximosKm ? Number(values.proximosKm) : undefined,
        proximoService: values.proximoService
          ? new Date(values.proximoService).toISOString()
          : undefined,
        fechaVencimientoVTV: values.fechaVencimientoVTV
          ? new Date(values.fechaVencimientoVTV).toISOString()
          : null,
        estado: values.estado,
      });
      toast.success(initialData ? 'Vehículo actualizado' : 'Vehículo creado correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string | Array<{ message: string }> } };
      };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.map((e: { message: string }) => e.message || e).join('. ')
        : backendError || 'Error al guardar el vehículo.';
      toast.error(message);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      description="Gestione los datos de flota."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="vehiculo-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar Vehículo
          </Button>
        </>
      }
    >
      <form id="vehiculo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Datos de Identificación
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Patente *"
              placeholder="AAA123"
              {...register('patente')}
              error={errors.patente?.message}
              className="font-mono font-bold uppercase"
            />
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select
                  label="Estado"
                  options={[
                    { value: 'ACTIVO', label: '✅ Activo' },
                    { value: 'TALLER', label: '🔧 En Taller' },
                    { value: 'FUERA_SERVICIO', label: '⛔ Fuera de Servicio' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Activity className="h-4 w-4" />}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Marca" placeholder="Ej: Toyota" {...register('marca')} />
            <Input label="Modelo" placeholder="Ej: Hilux" {...register('modelo')} />
            <Input label="Año" type="number" {...register('anio')} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Logística y Mantenimiento
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="zonaId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Zona (Opcional)"
                  options={zonas.map((z) => ({ value: z.id.toString(), label: z.nombre }))}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isFetchingZonas}
                  placeholder="Sin Asignar"
                  icon={<MapPin className="h-4 w-4" />}
                />
              )}
            />
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo"
                  options={[
                    { value: 'Camión', label: 'Camión' },
                    { value: 'Camioneta', label: 'Camioneta' },
                    { value: 'Furgón', label: 'Furgón' },
                    { value: 'Auto', label: 'Auto' },
                    { value: 'Utilitario', label: 'Utilitario' },
                    { value: 'Otro', label: 'Otro' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccione tipo..."
                  icon={<Car className="h-4 w-4" />}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="proximoService"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Próximo Service"
                  value={field.value || ''}
                  onChange={field.onChange}
                  icon={<Wrench className="h-4 w-4" />}
                />
              )}
            />
            <Controller
              name="fechaVencimientoVTV"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Vto. VTV"
                  value={field.value || ''}
                  onChange={field.onChange}
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kms Próx. Revisión"
              type="number"
              placeholder="Ej: 50000"
              {...register('proximosKm')}
            />
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
