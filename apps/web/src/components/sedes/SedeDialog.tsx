import { useEffect, useState } from 'react';
import { Save, User } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Sede, SedeFormData } from '../../types/sedes';
import type { Cliente } from '../../types/client';
import type { Zona } from '../../types/zona';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { User, MapPin } from 'lucide-react';

const sedeSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  zonaId: z.string().min(1, 'Debe seleccionar una zona'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().min(3, 'La dirección es requerida'),
  telefono: z.string().optional().or(z.literal('')),
  contactoNombre: z.string().optional().or(z.literal('')),
  contactoTelefono: z.string().optional().or(z.literal('')),
  codigoExterno: z.string().optional().or(z.literal('')),
});

type SedeFormValues = z.infer<typeof sedeSchema>;

interface SedeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SedeFormData) => Promise<void>;
  initialData?: Sede | null;
}

export default function SedeDialog({ isOpen, onClose, onSave, initialData }: SedeDialogProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isFetchingDeps, setIsFetchingDeps] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SedeFormValues>({
    resolver: zodResolver(sedeSchema),
    defaultValues: {
      clienteId: '',
      zonaId: '',
      nombre: '',
      direccion: '',
      telefono: '',
      contactoNombre: '',
      contactoTelefono: '',
      codigoExterno: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchDeps = async () => {
        setIsFetchingDeps(true);
        try {
          const [resClients, resZones] = await Promise.all([
            api.get('/clients?limit=100'),
            api.get('/zones?limit=100'),
          ]);
          setClientes(resClients.data.data || []);
          setZonas(resZones.data.data || []);
        } catch (err) {
          console.error('Error fetching dependencies:', err);
          toast.error('No se pudieron cargar los clientes o zonas.');
        } finally {
          setIsFetchingDeps(false);
        }
      };
      fetchDeps();

      if (initialData) {
        reset({
          clienteId: initialData.clienteId.toString(),
          zonaId: initialData.zonaId.toString(),
          nombre: initialData.nombre,
          direccion: initialData.direccion,
          telefono: initialData.telefono || '',
          contactoNombre: initialData.contactoNombre || '',
          contactoTelefono: initialData.contactoTelefono || '',
          codigoExterno: initialData.codigoExterno || '',
        });
      } else {
        reset({
          clienteId: '',
          zonaId: '',
          nombre: '',
          direccion: '',
          telefono: '',
          contactoNombre: '',
          contactoTelefono: '',
          codigoExterno: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: SedeFormValues) => {
    try {
      await onSave({
        clienteId: Number(values.clienteId),
        zonaId: Number(values.zonaId),
        nombre: values.nombre.trim(),
        direccion: values.direccion.trim(),
        telefono: values.telefono?.trim() || undefined,
        contactoNombre: values.contactoNombre?.trim() || undefined,
        contactoTelefono: values.contactoTelefono?.trim() || undefined,
        codigoExterno: values.codigoExterno?.trim() || undefined,
      });
      toast.success(initialData ? 'Sede actualizada' : 'Sede creada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string | Array<{ message: string }> } };
      };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.map((e: { message: string }) => e.message || e).join('. ')
        : backendError || 'Error al guardar la sede.';
      toast.error(message);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Sede' : 'Nueva Sede'}
      description="Complete los datos de la ubicación física."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="sede-form"
            isLoading={isSubmitting || isFetchingDeps}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar Sede
          </Button>
        </>
      }
    >
      <form id="sede-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="clienteId"
            control={control}
            render={({ field }) => (
              <Select
                label="Cliente Propietario *"
                options={clientes.map((c) => ({ value: c.id.toString(), label: c.razonSocial }))}
                value={field.value}
                onChange={field.onChange}
                isLoading={isFetchingDeps}
                placeholder="Seleccione un cliente..."
                icon={<User className="h-4 w-4" />}
                error={errors.clienteId?.message}
              />
            )}
          />
          <Controller
            name="zonaId"
            control={control}
            render={({ field }) => (
              <Select
                label="Zona Geográfica *"
                options={zonas.map((z) => ({ value: z.id.toString(), label: z.nombre }))}
                value={field.value}
                onChange={field.onChange}
                isLoading={isFetchingDeps}
                placeholder="Seleccione una zona..."
                icon={<MapPin className="h-4 w-4" />}
                error={errors.zonaId?.message}
              />
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nombre de la Sede *"
                placeholder="Ej: Depósito Norte"
                {...register('nombre')}
                error={errors.nombre?.message}
              />
            </div>
            <Input
              label="Código Externo"
              placeholder="Identif. Cliente"
              {...register('codigoExterno')}
              error={errors.codigoExterno?.message}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Dirección Completa *"
              placeholder="Av. Siempre Viva 123"
              {...register('direccion')}
              error={errors.direccion?.message}
            />
            <Input
              label="Teléfono Directo"
              placeholder="+54 11..."
              {...register('telefono')}
              error={errors.telefono?.message}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-2">
            <User className="h-4 w-4" />
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Responsable"
              {...register('contactoNombre')}
              error={errors.contactoNombre?.message}
            />
            <Input
              label="Teléfono Responsable"
              {...register('contactoTelefono')}
              error={errors.contactoTelefono?.message}
            />
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
