import { useState, useEffect } from 'react';
import { Save, ArrowLeftRight, Building2, DollarSign, FileText } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaFinanciera } from '../types';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';

interface TransferenciaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const transferenciaSchema = z
  .object({
    cuentaOrigenId: z.string().min(1, 'Seleccione la cuenta origen'),
    cuentaDestinoId: z.string().min(1, 'Seleccione la cuenta destino'),
    monto: z
      .string()
      .min(1, 'Ingrese un monto')
      .refine((v) => Number(v) > 0, 'El monto debe ser mayor a 0'),
    fechaMovimiento: z.string().min(1, 'Seleccione una fecha'),
    comprobante: z.string().optional().or(z.literal('')),
    descripcion: z.string().min(3, 'Ingrese una descripción'),
  })
  .refine((data) => data.cuentaOrigenId !== data.cuentaDestinoId, {
    message: 'La cuenta origen y destino deben ser diferentes',
    path: ['cuentaDestinoId'],
  });

type TransferenciaFormValues = z.infer<typeof transferenciaSchema>;

export default function TransferenciaDrawer({
  isOpen,
  onClose,
  onSuccess,
}: TransferenciaDrawerProps) {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransferenciaFormValues>({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: {
      cuentaOrigenId: '',
      cuentaDestinoId: '',
      monto: '',
      fechaMovimiento: new Date().toISOString().split('T')[0],
      comprobante: '',
      descripcion: '',
    },
  });

  const cuentaOrigenId = watch('cuentaOrigenId');
  const cuentaDestinoId = watch('cuentaDestinoId');

  useEffect(() => {
    if (isOpen) {
      reset({
        cuentaOrigenId: '',
        cuentaDestinoId: '',
        monto: '',
        fechaMovimiento: new Date().toISOString().split('T')[0],
        comprobante: '',
        descripcion: '',
      });
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const data = await finanzasApi.getCuentas();
        setCuentas(data.filter((c) => c.activa));
      } catch (e) {
        console.error(e);
      }
    };
    fetchCuentas();
  }, []);

  const cuentaOrigen = cuentas.find((c) => c.id.toString() === cuentaOrigenId);
  const cuentaDestino = cuentas.find((c) => c.id.toString() === cuentaDestinoId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  const onSubmit = async (values: TransferenciaFormValues) => {
    try {
      await finanzasApi.createTransferencia({
        cuentaOrigenId: Number(values.cuentaOrigenId),
        cuentaDestinoId: Number(values.cuentaDestinoId),
        monto: Number(values.monto),
        fechaMovimiento: new Date(values.fechaMovimiento).toISOString(),
        comprobante: values.comprobante || null,
        descripcion: values.descripcion,
      });
      toast.success('Transferencia registrada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transferencia:', error);
      toast.error('Error al crear la transferencia');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      type="drawer"
      title="Nueva Transferencia"
      description="Transferir entre cuentas"
      icon={
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="transferencia-form"
            isLoading={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Registrar Transferencia
          </Button>
        </>
      }
    >
      <form id="transferencia-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Cuenta Origen */}
        <div className="space-y-1.5">
          <Controller
            name="cuentaOrigenId"
            control={control}
            render={({ field }) => (
              <Select
                label="Cuenta Origen *"
                options={cuentas.map((c) => ({
                  value: c.id.toString(),
                  label: c.nombre,
                  description: c.banco?.nombreCorto || c.tipo,
                  icon: <Building2 className="h-4 w-4" />,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.cuentaOrigenId?.message}
                placeholder="Seleccionar cuenta origen..."
              />
            )}
          />
          {cuentaOrigen && (
            <p className="text-xs text-slate-500 pl-1">
              Saldo actual:{' '}
              <span className="font-semibold">{formatCurrency(cuentaOrigen.saldoActual)}</span>
            </p>
          )}
        </div>

        {/* Flecha visual */}
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20">
            <ArrowLeftRight className="h-5 w-5 text-indigo-500 rotate-90" />
          </div>
        </div>

        {/* Cuenta Destino */}
        <div className="space-y-1.5">
          <Controller
            name="cuentaDestinoId"
            control={control}
            render={({ field }) => (
              <Select
                label="Cuenta Destino *"
                options={cuentas
                  .filter((c) => c.id.toString() !== cuentaOrigenId)
                  .map((c) => ({
                    value: c.id.toString(),
                    label: c.nombre,
                    description: c.banco?.nombreCorto || c.tipo,
                    icon: <Building2 className="h-4 w-4" />,
                  }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.cuentaDestinoId?.message}
                placeholder="Seleccionar cuenta destino..."
              />
            )}
          />
          {cuentaDestino && (
            <p className="text-xs text-slate-500 pl-1">
              Saldo actual:{' '}
              <span className="font-semibold">{formatCurrency(cuentaDestino.saldoActual)}</span>
            </p>
          )}
        </div>

        {/* Monto y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="transferencia-monto"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" /> Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                $
              </span>
              <input
                id="transferencia-monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('monto')}
                className="w-full h-10 pl-7 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand tabular-nums text-slate-900 dark:text-white"
              />
            </div>
            {errors.monto && (
              <p role="alert" className="text-[11px] font-medium text-red-500">
                {errors.monto.message}
              </p>
            )}
          </div>
          <Controller
            name="fechaMovimiento"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Fecha *"
                value={field.value}
                onChange={field.onChange}
                error={errors.fechaMovimiento?.message}
              />
            )}
          />
        </div>

        {/* Comprobante */}
        <Input
          label="Comprobante"
          placeholder="Nro de comprobante, referencia, etc."
          leftIcon={<FileText className="h-4 w-4" />}
          {...register('comprobante')}
        />

        {/* Descripción */}
        <div className="space-y-1.5">
          <label
            htmlFor="transferencia-descripcion"
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            Descripción *
          </label>
          <textarea
            id="transferencia-descripcion"
            rows={2}
            placeholder="Motivo de la transferencia..."
            {...register('descripcion')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand resize-none text-slate-900 dark:text-white"
          />
          {errors.descripcion && (
            <p role="alert" className="text-[11px] font-medium text-red-500">
              {errors.descripcion.message}
            </p>
          )}
        </div>
      </form>
    </DialogBase>
  );
}
