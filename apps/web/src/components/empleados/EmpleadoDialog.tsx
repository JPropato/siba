import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type {
  Empleado,
  EmpleadoFormData,
  TipoEmpleado,
  TipoContratacion,
} from '../../types/empleados';
import type { Zona } from '../../types/zona';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { DatePicker } from '../ui/core/DatePicker';
import { MapPin, Briefcase, UserCircle } from 'lucide-react';

const empleadoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  inicioRelacionLaboral: z.string().min(1, 'La fecha de inicio es requerida'),
  tipo: z.enum(['TECNICO', 'ADMINISTRATIVO', 'GERENTE']),
  contratacion: z.enum(['CONTRATO_MARCO']).optional().or(z.literal('')),
  zonaId: z.string().optional().or(z.literal('')),
});

type EmpleadoFormValues = z.infer<typeof empleadoSchema>;

interface EmpleadoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpleadoFormData) => Promise<void>;
  initialData?: Empleado | null;
}

export default function EmpleadoDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EmpleadoDialogProps) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isFetchingZonas, setIsFetchingZonas] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      direccion: '',
      telefono: '',
      inicioRelacionLaboral: '',
      tipo: 'TECNICO',
      contratacion: '',
      zonaId: '',
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
          nombre: initialData.nombre,
          apellido: initialData.apellido,
          email: initialData.email || '',
          direccion: initialData.direccion || '',
          telefono: initialData.telefono || '',
          inicioRelacionLaboral: new Date(initialData.inicioRelacionLaboral).toISOString().split('T')[0],
          tipo: initialData.tipo,
          contratacion: initialData.contratacion || '',
          zonaId: initialData.zonaId?.toString() || '',
        });
      } else {
        reset({
          nombre: '',
          apellido: '',
          email: '',
          direccion: '',
          telefono: '',
          inicioRelacionLaboral: '',
          tipo: 'TECNICO',
          contratacion: '',
          zonaId: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: EmpleadoFormValues) => {
    try {
      await onSave({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email?.trim() || null,
        direccion: values.direccion?.trim() || null,
        telefono: values.telefono?.trim() || null,
        inicioRelacionLaboral: new Date(values.inicioRelacionLaboral).toISOString(),
        tipo: values.tipo as TipoEmpleado,
        contratacion: (values.contratacion as TipoContratacion) || null,
        zonaId: values.zonaId ? Number(values.zonaId) : null,
      });
      toast.success(initialData ? 'Empleado actualizado' : 'Empleado creado correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string | string[] } } };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.map((e: any) => e.message || String(e)).join('. ')
        : backendError || 'Error al guardar el empleado.';
      toast.error(message);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Empleado' : 'Nuevo Empleado'}
      description="Complete los datos del colaborador."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="empleado-form"
            isLoading={isSubmitting}
            leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
          >
            Guardar Empleado
          </Button>
        </>
      }
    >
      <form id="empleado-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos Personales */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Datos Personales
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Juan"
              {...register('nombre')}
              error={errors.nombre?.message}
            />
            <Input
              label="Apellido *"
              placeholder="Pérez"
              {...register('apellido')}
              error={errors.apellido?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="jperez@empresa.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Teléfono"
              placeholder="+54 11 1234-5678"
              {...register('telefono')}
              error={errors.telefono?.message}
            />
          </div>
          <Input
            label="Dirección"
            placeholder="Av. Siempre Viva 123"
            {...register('direccion')}
            error={errors.direccion?.message}
          />
        </div>

        {/* Datos Laborales */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Datos Laborales
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="inicioRelacionLaboral"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Inicio Relación Laboral *"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.inicioRelacionLaboral?.message}
                />
              )}
            />
            <Controller
              name="zonaId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Zona (Opcional)"
                  options={zonas.map(z => ({ value: z.id.toString(), label: z.nombre }))}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isFetchingZonas}
                  placeholder="Sin Asignar"
                  icon={<MapPin className="h-4 w-4" />}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo *"
                  options={[
                    { value: 'TECNICO', label: '👷 Técnico' },
                    { value: 'ADMINISTRATIVO', label: '📋 Administrativo' },
                    { value: 'GERENTE', label: '👔 Gerente' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<UserCircle className="h-4 w-4" />}
                />
              )}
            />
            <Controller
              name="contratacion"
              control={control}
              render={({ field }) => (
                <Select
                  label="Contratación"
                  options={[
                    { value: 'CONTRATO_MARCO', label: 'Contrato Marco' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sin especificar"
                  icon={<Briefcase className="h-4 w-4" />}
                />
              )}
            />
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
