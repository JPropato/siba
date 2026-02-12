import { useEffect, useState } from 'react';
import { Save, CreditCard, User, Building2, Activity } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../../lib/api';
import type { TarjetaPrecargable, TarjetaFormData } from '../types';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';

const tarjetaSchema = z.object({
  tipo: z.enum(['PRECARGABLE', 'CORPORATIVA']),
  tipoTarjetaFinanciera: z.string().optional().or(z.literal('')),
  redProcesadora: z.string().optional().or(z.literal('')),
  alias: z.string().optional().or(z.literal('')),
  numeroTarjeta: z.string().optional().or(z.literal('')),
  empleadoId: z.string().min(1, 'El titular es requerido'),
  cuentaFinancieraId: z.string().min(1, 'La cuenta financiera es requerida'),
  bancoId: z.string().optional().or(z.literal('')),
  estado: z.enum(['ACTIVA', 'SUSPENDIDA', 'BAJA']).optional(),
});

type TarjetaFormValues = z.infer<typeof tarjetaSchema>;

interface TarjetaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TarjetaFormData) => Promise<void>;
  initialData?: TarjetaPrecargable | null;
}

export default function TarjetaDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TarjetaDialogProps) {
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string; apellido: string }[]>(
    []
  );
  const [cuentas, setCuentas] = useState<{ id: number; nombre: string; saldoActual: number }[]>([]);
  const [bancos, setBancos] = useState<{ id: number; nombreCorto: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TarjetaFormValues>({
    resolver: zodResolver(tarjetaSchema),
    defaultValues: {
      tipo: 'PRECARGABLE',
      tipoTarjetaFinanciera: '',
      redProcesadora: '',
      alias: '',
      numeroTarjeta: '',
      empleadoId: '',
      cuentaFinancieraId: '',
      bancoId: '',
      estado: 'ACTIVA',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsFetching(true);
        try {
          // Fetch empleados activos
          const resEmpleados = await api.get('/empleados', {
            params: { estado: 'ACTIVO', limit: 100 },
          });
          setEmpleados(
            (resEmpleados.data.data || []).map(
              (e: { id: number; nombre: string; apellido: string }) => ({
                id: e.id,
                nombre: e.nombre,
                apellido: e.apellido,
              })
            )
          );

          // Fetch cuentas financieras activas
          const resCuentas = await api.get('/finanzas/cuentas', {
            params: { activa: true },
          });
          setCuentas(
            (resCuentas.data.data || []).map(
              (c: { id: number; nombre: string; saldoActual: number }) => ({
                id: c.id,
                nombre: c.nombre,
                saldoActual: c.saldoActual,
              })
            )
          );

          // Fetch bancos
          const resBancos = await api.get('/finanzas/bancos');
          setBancos(
            (resBancos.data.data || []).map((b: { id: number; nombreCorto: string }) => ({
              id: b.id,
              nombreCorto: b.nombreCorto,
            }))
          );
        } catch (err) {
          console.error('Error fetching data:', err);
          toast.error('Error al cargar los datos del formulario');
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();

      if (initialData) {
        reset({
          tipo: initialData.tipo,
          tipoTarjetaFinanciera: initialData.tipoTarjetaFinanciera || '',
          redProcesadora: initialData.redProcesadora || '',
          alias: initialData.alias || '',
          numeroTarjeta: initialData.numeroTarjeta || '',
          empleadoId: initialData.empleadoId.toString(),
          cuentaFinancieraId: initialData.cuentaFinancieraId.toString(),
          bancoId: initialData.bancoId?.toString() || '',
          estado: initialData.estado,
        });
      } else {
        reset({
          tipo: 'PRECARGABLE',
          tipoTarjetaFinanciera: '',
          redProcesadora: '',
          alias: '',
          numeroTarjeta: '',
          empleadoId: '',
          cuentaFinancieraId: '',
          bancoId: '',
          estado: 'ACTIVA',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: TarjetaFormValues) => {
    try {
      await onSave({
        tipo: values.tipo,
        tipoTarjetaFinanciera:
          values.tipoTarjetaFinanciera && values.tipoTarjetaFinanciera !== ''
            ? (values.tipoTarjetaFinanciera as 'CREDITO' | 'DEBITO' | 'PREPAGA')
            : undefined,
        redProcesadora:
          values.redProcesadora && values.redProcesadora !== ''
            ? (values.redProcesadora as
                | 'VISA'
                | 'MASTERCARD'
                | 'CABAL'
                | 'NARANJA'
                | 'AMERICAN_EXPRESS'
                | 'MAESTRO')
            : undefined,
        alias: values.alias?.trim() || undefined,
        numeroTarjeta: values.numeroTarjeta?.trim() || undefined,
        empleadoId: Number(values.empleadoId),
        cuentaFinancieraId: Number(values.cuentaFinancieraId),
        bancoId: values.bancoId ? Number(values.bancoId) : undefined,
        estado: values.estado,
      });
      toast.success(initialData ? 'Tarjeta actualizada' : 'Tarjeta creada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string | Array<{ message: string }> } };
      };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.map((e: { message: string }) => e.message || e).join('. ')
        : backendError || 'Error al guardar la tarjeta.';
      toast.error(message);
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
      description="Gestione las tarjetas precargables y corporativas."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="tarjeta-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar Tarjeta
          </Button>
        </>
      }
    >
      <form id="tarjeta-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Datos de la Tarjeta
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo *"
                  options={[
                    { value: 'PRECARGABLE', label: 'Precargable' },
                    { value: 'CORPORATIVA', label: 'Corporativa' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<CreditCard className="h-4 w-4" />}
                  disabled={!!initialData}
                />
              )}
            />
            {initialData && (
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Estado"
                    options={[
                      { value: 'ACTIVA', label: 'Activa' },
                      { value: 'SUSPENDIDA', label: 'Suspendida' },
                      { value: 'BAJA', label: 'Baja' },
                    ]}
                    value={field.value || 'ACTIVA'}
                    onChange={field.onChange}
                    icon={<Activity className="h-4 w-4" />}
                  />
                )}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Alias"
              placeholder="Ej: Tarjeta Principal"
              {...register('alias')}
              error={errors.alias?.message}
            />
            <Input
              label="Número de Tarjeta"
              placeholder="Últimos 4 dígitos"
              {...register('numeroTarjeta')}
              error={errors.numeroTarjeta?.message}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Controller
              name="tipoTarjetaFinanciera"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo Financiero"
                  options={[
                    { value: 'CREDITO', label: 'Crédito' },
                    { value: 'DEBITO', label: 'Débito' },
                    { value: 'PREPAGA', label: 'Prepaga' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sin especificar"
                />
              )}
            />
            <Controller
              name="redProcesadora"
              control={control}
              render={({ field }) => (
                <Select
                  label="Red / Procesadora"
                  options={[
                    { value: 'VISA', label: 'Visa' },
                    { value: 'MASTERCARD', label: 'Mastercard' },
                    { value: 'CABAL', label: 'Cabal' },
                    { value: 'NARANJA', label: 'Naranja' },
                    { value: 'AMERICAN_EXPRESS', label: 'American Express' },
                    { value: 'MAESTRO', label: 'Maestro' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sin especificar"
                />
              )}
            />
            <Controller
              name="bancoId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Banco Emisor"
                  options={bancos.map((b) => ({
                    value: b.id.toString(),
                    label: b.nombreCorto,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isFetching}
                  placeholder="Sin especificar"
                  icon={<Building2 className="h-4 w-4" />}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Titular y Cuenta
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="empleadoId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Titular *"
                  options={empleados.map((e) => ({
                    value: e.id.toString(),
                    label: `${e.apellido}, ${e.nombre}`,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isFetching}
                  placeholder="Seleccione empleado..."
                  icon={<User className="h-4 w-4" />}
                  error={errors.empleadoId?.message}
                />
              )}
            />
            <Controller
              name="cuentaFinancieraId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Cuenta Financiera *"
                  options={cuentas.map((c) => ({
                    value: c.id.toString(),
                    label: `${c.nombre} (${new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(c.saldoActual)})`,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  isLoading={isFetching}
                  placeholder="Seleccione cuenta..."
                  icon={<Building2 className="h-4 w-4" />}
                  error={errors.cuentaFinancieraId?.message}
                />
              )}
            />
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
