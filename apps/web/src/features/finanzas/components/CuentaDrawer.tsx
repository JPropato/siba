import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaFinanciera, TipoCuenta, Banco } from '../types';
import { TIPO_CUENTA_CONFIG } from '../types';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import { Building2, Wallet, CreditCard, Smartphone, TrendingUp, PiggyBank } from 'lucide-react';

interface CuentaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cuenta: CuentaFinanciera | null;
  onSuccess: () => void;
}

const TIPOS_CUENTA: TipoCuenta[] = [
  'CAJA_CHICA',
  'CUENTA_CORRIENTE',
  'CAJA_AHORRO',
  'BILLETERA_VIRTUAL',
  'INVERSION',
];

const TIPOS_INVERSION = [
  { value: 'PLAZO_FIJO', label: 'Plazo Fijo' },
  { value: 'FCI', label: 'Fondo Común de Inversión' },
  { value: 'CAUCIONES', label: 'Cauciones' },
  { value: 'OTRO', label: 'Otro' },
];

const cuentaSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  tipo: z.enum(['CAJA_CHICA', 'CUENTA_CORRIENTE', 'CAJA_AHORRO', 'BILLETERA_VIRTUAL', 'INVERSION']),
  bancoId: z.string().optional().or(z.literal('')),
  numeroCuenta: z.string().optional().or(z.literal('')),
  cbu: z.string().optional().or(z.literal('')),
  alias: z.string().optional().or(z.literal('')),
  saldoInicial: z.string(),
  moneda: z.enum(['ARS', 'USD']),
  tipoInversion: z.string().optional().or(z.literal('')),
  tasaAnual: z.string().optional().or(z.literal('')),
  fechaVencimiento: z.string().optional().or(z.literal('')),
});

type CuentaFormValues = z.infer<typeof cuentaSchema>;

const getIconForType = (type: TipoCuenta) => {
  switch (type) {
    case 'CAJA_CHICA':
      return <Wallet className="h-5 w-5" />;
    case 'CUENTA_CORRIENTE':
      return <Building2 className="h-5 w-5" />;
    case 'CAJA_AHORRO':
      return <PiggyBank className="h-5 w-5" />;
    case 'BILLETERA_VIRTUAL':
      return <Smartphone className="h-5 w-5" />;
    case 'INVERSION':
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export default function CuentaDrawer({ isOpen, onClose, cuenta, onSuccess }: CuentaDrawerProps) {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const isEditing = !!cuenta;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CuentaFormValues>({
    resolver: zodResolver(cuentaSchema),
    defaultValues: {
      nombre: '',
      tipo: 'CUENTA_CORRIENTE',
      bancoId: '',
      numeroCuenta: '',
      cbu: '',
      alias: '',
      saldoInicial: '0',
      moneda: 'ARS',
      tipoInversion: '',
      tasaAnual: '',
      fechaVencimiento: '',
    },
  });

  const tipo = watch('tipo');
  const showBancoField = tipo !== 'CAJA_CHICA';
  const showInversionFields = tipo === 'INVERSION';

  useEffect(() => {
    const fetchBancos = async () => {
      try {
        const data = await finanzasApi.getBancos();
        setBancos(data);
      } catch (error) {
        console.error('Error fetching bancos:', error);
      }
    };
    fetchBancos();
  }, []);

  useEffect(() => {
    if (cuenta) {
      reset({
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        bancoId: cuenta.bancoId?.toString() || '',
        numeroCuenta: cuenta.numeroCuenta || '',
        cbu: cuenta.cbu || '',
        alias: cuenta.alias || '',
        saldoInicial: cuenta.saldoInicial.toString(),
        moneda: cuenta.moneda as 'ARS' | 'USD',
        tipoInversion: cuenta.tipoInversion || '',
        tasaAnual: cuenta.tasaAnual?.toString() || '',
        fechaVencimiento: cuenta.fechaVencimiento?.split('T')[0] || '',
      });
    } else {
      reset({
        nombre: '',
        tipo: 'CUENTA_CORRIENTE',
        bancoId: '',
        numeroCuenta: '',
        cbu: '',
        alias: '',
        saldoInicial: '0',
        moneda: 'ARS',
        tipoInversion: '',
        tasaAnual: '',
        fechaVencimiento: '',
      });
    }
  }, [cuenta, reset]);

  const onSubmit = async (values: CuentaFormValues) => {
    try {
      const data = {
        nombre: values.nombre,
        tipo: values.tipo as TipoCuenta,
        bancoId: values.bancoId ? Number(values.bancoId) : null,
        numeroCuenta: values.numeroCuenta || null,
        cbu: values.cbu || null,
        alias: values.alias || null,
        saldoInicial: Number(values.saldoInicial),
        moneda: values.moneda,
        tipoInversion: showInversionFields ? values.tipoInversion || null : null,
        tasaAnual: showInversionFields && values.tasaAnual ? Number(values.tasaAnual) : null,
        fechaVencimiento:
          showInversionFields && values.fechaVencimiento
            ? new Date(values.fechaVencimiento).toISOString()
            : null,
      };

      if (isEditing && cuenta) {
        await finanzasApi.updateCuenta(cuenta.id, data);
        toast.success('Cuenta actualizada correctamente');
      } else {
        await finanzasApi.createCuenta(data);
        toast.success('Cuenta creada correctamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving cuenta:', error);
      toast.error('Error al guardar la cuenta');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      type="drawer"
      title={isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
      description={TIPO_CUENTA_CONFIG[tipo]?.label || 'Gestione cuentas financieras'}
      icon={<div className="p-2 rounded-xl bg-brand/10 text-brand">{getIconForType(tipo)}</div>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="cuenta-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
          </Button>
        </>
      }
    >
      <form id="cuenta-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipo de Cuenta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo de Cuenta *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_CUENTA.map((t) => (
              <label
                key={t}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                  tipo === t
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <input type="radio" value={t} {...register('tipo')} className="sr-only" />
                {getIconForType(t)}
                {TIPO_CUENTA_CONFIG[t]?.label}
              </label>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <Input
          label="Nombre de la Cuenta *"
          placeholder="Ej: Caja Chica Oficina, Banco Nación CC"
          {...register('nombre')}
          error={errors.nombre?.message}
        />

        {/* Banco */}
        {showBancoField && (
          <Controller
            name="bancoId"
            control={control}
            render={({ field }) => (
              <Select
                label="Banco / Entidad"
                options={bancos.map((b) => ({ value: b.id.toString(), label: b.nombreCorto }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar banco..."
                icon={<Building2 className="h-4 w-4" />}
                error={errors.bancoId?.message}
              />
            )}
          />
        )}

        {/* CBU y Alias */}
        {showBancoField && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CBU"
              placeholder="22 dígitos"
              maxLength={22}
              className="font-mono"
              {...register('cbu')}
            />
            <Input label="Alias" placeholder="mi.alias.cbu" {...register('alias')} />
          </div>
        )}

        {/* Número de Cuenta */}
        {showBancoField && (
          <Input
            label="Número de Cuenta"
            placeholder="Número de cuenta bancaria"
            {...register('numeroCuenta')}
          />
        )}

        {/* Saldo Inicial y Moneda */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo Inicial
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                $
              </span>
              <input
                type="number"
                disabled={isEditing}
                {...register('saldoInicial')}
                className="w-full h-10 pl-7 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all disabled:opacity-60 text-slate-900 dark:text-white"
              />
            </div>
            {isEditing && (
              <p className="text-xs text-slate-400">El saldo inicial no se puede modificar</p>
            )}
          </div>
          <Controller
            name="moneda"
            control={control}
            render={({ field }) => (
              <Select
                label="Moneda"
                options={[
                  { value: 'ARS', label: 'ARS - Peso Argentino' },
                  { value: 'USD', label: 'USD - Dólar' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Campos de Inversión */}
        {showInversionFields && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Datos de Inversión
            </h3>

            <Controller
              name="tipoInversion"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Inversión"
                  options={TIPOS_INVERSION}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar tipo..."
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tasa Anual (%)"
                type="number"
                placeholder="Ej: 45"
                step="0.01"
                {...register('tasaAnual')}
              />
              <Controller
                name="fechaVencimiento"
                control={control}
                render={({ field }) => (
                  <DatePicker label="Vencimiento" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </div>
        )}
      </form>
    </DialogBase>
  );
}
