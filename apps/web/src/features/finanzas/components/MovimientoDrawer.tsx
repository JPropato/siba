import { useState, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { finanzasApi } from '../api/finanzasApi';
import type {
  CuentaFinanciera,
  TipoMovimiento,
  MedioPago,
  CategoriaIngreso,
  CategoriaEgreso,
} from '../types';
import {
  CATEGORIA_INGRESO_LABELS,
  CATEGORIA_EGRESO_LABELS,
  MEDIO_PAGO_LABELS,
  MEDIO_PAGO_POR_DEFECTO,
} from '../types';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  DollarSign,
  FileText,
  Building2,
  Ticket,
  Wrench,
  User,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react';
import api from '../../../lib/api';

type TipoOperacion = 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA';

interface MovimientoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Cliente {
  id: number;
  razonSocial: string;
}
interface ObraOption {
  id: number;
  codigo: string;
  titulo: string;
}
interface TicketOption {
  id: number;
  codigoInterno: number;
  descripcion: string;
}

const MEDIOS_PAGO: MedioPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'CHEQUE',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
  'MERCADOPAGO',
];
const CATEGORIAS_INGRESO: CategoriaIngreso[] = [
  'COBRO_FACTURA',
  'ANTICIPO_CLIENTE',
  'REINTEGRO',
  'RENDIMIENTO_INVERSION',
  'RESCATE_INVERSION',
  'OTRO_INGRESO',
];
const CATEGORIAS_EGRESO: CategoriaEgreso[] = [
  'MATERIALES',
  'MANO_DE_OBRA',
  'COMBUSTIBLE',
  'HERRAMIENTAS',
  'VIATICOS',
  'SUBCONTRATISTA',
  'IMPUESTOS',
  'SERVICIOS',
  'TRASPASO_INVERSION',
  'OTRO_EGRESO',
];

const movimientoSchema = z
  .object({
    tipo: z.enum(['INGRESO', 'EGRESO', 'TRANSFERENCIA']),
    cuentaId: z.string().optional().or(z.literal('')),
    cuentaOrigenId: z.string().optional().or(z.literal('')),
    cuentaDestinoId: z.string().optional().or(z.literal('')),
    monto: z
      .string()
      .min(1, 'Ingrese un monto')
      .refine((v) => Number(v) > 0, 'El monto debe ser mayor a 0'),
    fechaMovimiento: z.string().min(1, 'Seleccione una fecha'),
    medioPago: z.enum([
      'EFECTIVO',
      'TRANSFERENCIA',
      'CHEQUE',
      'TARJETA_DEBITO',
      'TARJETA_CREDITO',
      'MERCADOPAGO',
    ]),
    categoriaIngreso: z
      .enum([
        'COBRO_FACTURA',
        'ANTICIPO_CLIENTE',
        'REINTEGRO',
        'RENDIMIENTO_INVERSION',
        'RESCATE_INVERSION',
        'OTRO_INGRESO',
      ])
      .optional(),
    categoriaEgreso: z
      .enum([
        'MATERIALES',
        'MANO_DE_OBRA',
        'COMBUSTIBLE',
        'HERRAMIENTAS',
        'VIATICOS',
        'SUBCONTRATISTA',
        'IMPUESTOS',
        'SERVICIOS',
        'TRASPASO_INVERSION',
        'OTRO_EGRESO',
      ])
      .optional(),
    comprobante: z.string().optional().or(z.literal('')),
    comprobanteUrl: z.string().optional().nullable(),
    descripcion: z.string().min(3, 'Ingrese una descripción'),
    clienteId: z.string().optional().or(z.literal('')),
    obraId: z.string().optional().or(z.literal('')),
    ticketId: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'TRANSFERENCIA') {
      if (!data.cuentaOrigenId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaOrigenId'],
          message: 'Seleccione la cuenta origen',
        });
      }
      if (!data.cuentaDestinoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaDestinoId'],
          message: 'Seleccione la cuenta destino',
        });
      }
      if (
        data.cuentaOrigenId &&
        data.cuentaDestinoId &&
        data.cuentaOrigenId === data.cuentaDestinoId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaDestinoId'],
          message: 'Las cuentas origen y destino deben ser diferentes',
        });
      }
    } else {
      if (!data.cuentaId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cuentaId'],
          message: 'Seleccione una cuenta',
        });
      }
    }
  });

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const TIPO_CONFIG: Record<
  TipoOperacion,
  {
    label: string;
    activeClass: string;
    bgColor: string;
    textColor: string;
    icon: React.ReactNode;
    buttonClass: string;
    buttonLabel: string;
  }
> = {
  INGRESO: {
    label: 'INGRESO',
    activeClass:
      'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    icon: <ArrowUpCircle className="h-5 w-5" />,
    buttonClass: 'bg-green-600 hover:bg-green-700',
    buttonLabel: 'Registrar Ingreso',
  },
  EGRESO: {
    label: 'EGRESO',
    activeClass: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    icon: <ArrowDownCircle className="h-5 w-5" />,
    buttonClass: 'bg-red-600 hover:bg-red-700',
    buttonLabel: 'Registrar Egreso',
  },
  TRANSFERENCIA: {
    label: 'TRANSFERENCIA',
    activeClass:
      'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    icon: <ArrowLeftRight className="h-5 w-5" />,
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700',
    buttonLabel: 'Registrar Transferencia',
  },
};

const DEFAULT_VALUES: MovimientoFormValues = {
  tipo: 'INGRESO',
  cuentaId: '',
  cuentaOrigenId: '',
  cuentaDestinoId: '',
  monto: '',
  fechaMovimiento: new Date().toISOString().split('T')[0],
  medioPago: 'TRANSFERENCIA',
  categoriaIngreso: 'COBRO_FACTURA',
  categoriaEgreso: 'MATERIALES',
  comprobante: '',
  comprobanteUrl: null,
  descripcion: '',
  clienteId: '',
  obraId: '',
  ticketId: '',
};

export default function MovimientoDrawer({ isOpen, onClose, onSuccess }: MovimientoDrawerProps) {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<ObraOption[]>([]);
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const tipo = watch('tipo') as TipoOperacion;
  const cuentaIdValue = watch('cuentaId');
  const cuentaOrigenIdValue = watch('cuentaOrigenId');
  const clienteId = watch('clienteId');

  const isTransferencia = tipo === 'TRANSFERENCIA';
  const config = TIPO_CONFIG[tipo];

  useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_VALUES);
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

  // Auto-set medioPago when account is selected (for INGRESO/EGRESO)
  useEffect(() => {
    if (cuentaIdValue && !isTransferencia) {
      const cuenta = cuentas.find((c) => c.id.toString() === cuentaIdValue);
      if (cuenta) {
        setValue('medioPago', MEDIO_PAGO_POR_DEFECTO[cuenta.tipo]);
      }
    }
  }, [cuentaIdValue, cuentas, setValue, isTransferencia]);

  // Auto-set medioPago to TRANSFERENCIA when in transfer mode
  useEffect(() => {
    if (isTransferencia) {
      setValue('medioPago', 'TRANSFERENCIA');
    }
  }, [isTransferencia, setValue]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get('/clients?limit=1000');
        setClientes(res.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!clienteId) {
      setObras([]);
      setValue('obraId', '');
      return;
    }
    const fetchObras = async () => {
      try {
        const res = await api.get(`/obras?clienteId=${clienteId}&limit=100`);
        setObras(res.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchObras();
  }, [clienteId, setValue]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets?limit=100');
        setTickets(res.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTickets();
  }, []);

  const cuentaOrigen = cuentas.find((c) => c.id.toString() === cuentaOrigenIdValue);
  const cuentaDestinoIdValue = watch('cuentaDestinoId');
  const cuentaDestino = cuentas.find((c) => c.id.toString() === cuentaDestinoIdValue);

  const onSubmit = async (values: MovimientoFormValues) => {
    try {
      if (values.tipo === 'TRANSFERENCIA') {
        await finanzasApi.createTransferencia({
          cuentaOrigenId: Number(values.cuentaOrigenId),
          cuentaDestinoId: Number(values.cuentaDestinoId),
          monto: Number(values.monto),
          fechaMovimiento: new Date(values.fechaMovimiento).toISOString(),
          comprobante: values.comprobante || null,
          descripcion: values.descripcion,
        });
        toast.success('Transferencia registrada correctamente');
      } else {
        const data = {
          tipo: values.tipo as TipoMovimiento,
          cuentaId: Number(values.cuentaId),
          monto: Number(values.monto),
          fechaMovimiento: new Date(values.fechaMovimiento).toISOString(),
          medioPago: values.medioPago as MedioPago,
          categoriaIngreso: values.tipo === 'INGRESO' ? values.categoriaIngreso : null,
          categoriaEgreso: values.tipo === 'EGRESO' ? values.categoriaEgreso : null,
          comprobante: values.comprobante || null,
          comprobanteUrl: values.comprobanteUrl || null,
          descripcion: values.descripcion,
          clienteId: values.clienteId ? Number(values.clienteId) : null,
          obraId: values.obraId ? Number(values.obraId) : null,
          ticketId: values.ticketId ? Number(values.ticketId) : null,
        };
        await finanzasApi.createMovimiento(data);
        toast.success(
          `${values.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado correctamente`
        );
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating movimiento:', error);
      toast.error(
        isTransferencia ? 'Error al crear la transferencia' : 'Error al crear el movimiento'
      );
    }
  };

  const drawerDescription = isTransferencia
    ? 'Transferir entre cuentas'
    : tipo === 'INGRESO'
      ? 'Registrar ingreso'
      : 'Registrar egreso';

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      type="drawer"
      title="Nuevo Movimiento"
      description={drawerDescription}
      icon={
        <div className={`p-2 rounded-xl ${config.bgColor} ${config.textColor}`}>{config.icon}</div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="movimiento-form"
            isLoading={isSubmitting}
            className={config.buttonClass}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            {config.buttonLabel}
          </Button>
        </>
      }
    >
      <form id="movimiento-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipo Toggle - 3 opciones */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo de Movimiento *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['INGRESO', 'EGRESO', 'TRANSFERENCIA'] as TipoOperacion[]).map((t) => {
              const c = TIPO_CONFIG[t];
              return (
                <label
                  key={t}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    tipo === t
                      ? c.activeClass
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" value={t} {...register('tipo')} className="sr-only" />
                  {c.icon}
                  <span className="hidden sm:inline">{c.label}</span>
                  <span className="sm:hidden">{t === 'TRANSFERENCIA' ? 'TRANSF.' : c.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* === Cuenta(s) === */}
        {isTransferencia ? (
          <>
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
                      .filter((c) => c.id.toString() !== cuentaOrigenIdValue)
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
          </>
        ) : (
          /* Cuenta única para INGRESO/EGRESO */
          <Controller
            name="cuentaId"
            control={control}
            render={({ field }) => (
              <Select
                label="Cuenta *"
                options={cuentas.map((c) => ({
                  value: c.id.toString(),
                  label: c.nombre,
                  description: c.banco?.nombreCorto || c.tipo,
                  icon: <Building2 className="h-4 w-4" />,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.cuentaId?.message}
                placeholder="Seleccionar cuenta..."
              />
            )}
          />
        )}

        {/* Monto y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="monto-input"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" /> Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                $
              </span>
              <input
                id="monto-input"
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

        {/* Medio de Pago - solo para INGRESO/EGRESO */}
        {!isTransferencia && (
          <Controller
            name="medioPago"
            control={control}
            render={({ field }) => (
              <Select
                label="Medio de Pago *"
                options={MEDIOS_PAGO.map((mp) => ({ value: mp, label: MEDIO_PAGO_LABELS[mp] }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {/* Categoría - solo para INGRESO/EGRESO */}
        {!isTransferencia && (
          <Controller
            name={tipo === 'INGRESO' ? 'categoriaIngreso' : 'categoriaEgreso'}
            control={control}
            render={({ field }) => (
              <Select
                label="Categoría *"
                options={
                  tipo === 'INGRESO'
                    ? CATEGORIAS_INGRESO.map((cat) => ({
                        value: cat,
                        label: CATEGORIA_INGRESO_LABELS[cat],
                      }))
                    : CATEGORIAS_EGRESO.map((cat) => ({
                        value: cat,
                        label: CATEGORIA_EGRESO_LABELS[cat],
                      }))
                }
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {/* Comprobante */}
        <Input
          label="Comprobante"
          placeholder="Nro de factura, recibo, etc."
          leftIcon={<FileText className="h-4 w-4" />}
          {...register('comprobante')}
        />

        {/* Adjuntar archivo comprobante */}
        <Controller
          name="comprobanteUrl"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Adjuntar Comprobante
              </label>
              {field.value ? (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <Paperclip className="h-4 w-4 text-brand shrink-0" />
                  <a
                    href={field.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:underline truncate flex-1"
                  >
                    Archivo adjunto
                  </a>
                  <button
                    type="button"
                    onClick={() => field.onChange(null)}
                    className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full p-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  {isUploadingFile ? 'Subiendo...' : 'Adjuntar factura, recibo o comprobante'}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error('El archivo no puede superar 10MB');
                    return;
                  }
                  setIsUploadingFile(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await api.post('/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    field.onChange(res.data.data.url);
                  } catch {
                    toast.error('Error al subir el archivo');
                  } finally {
                    setIsUploadingFile(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
            </div>
          )}
        />

        {/* Descripción */}
        <div className="space-y-1.5">
          <label
            htmlFor="descripcion-input"
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            Descripción *
          </label>
          <textarea
            id="descripcion-input"
            rows={2}
            placeholder={
              isTransferencia ? 'Motivo de la transferencia...' : 'Detalle del movimiento...'
            }
            {...register('descripcion')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand resize-none text-slate-900 dark:text-white"
          />
          {errors.descripcion && (
            <p role="alert" className="text-[11px] font-medium text-red-500">
              {errors.descripcion.message}
            </p>
          )}
        </div>

        {/* Vinculaciones - solo para INGRESO/EGRESO */}
        {!isTransferencia && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Vincular a (opcional)
            </h3>

            <Controller
              name="clienteId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Cliente"
                  options={clientes.map((c) => ({
                    value: c.id.toString(),
                    label: c.razonSocial,
                    icon: <User className="h-4 w-4" />,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar cliente..."
                />
              )}
            />

            <Controller
              name="obraId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Obra"
                  options={obras.map((o) => ({
                    value: o.id.toString(),
                    label: `${o.codigo} - ${o.titulo}`,
                    icon: <Wrench className="h-4 w-4" />,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!clienteId}
                  placeholder={clienteId ? 'Sin vincular' : 'Seleccione cliente primero'}
                />
              )}
            />

            <Controller
              name="ticketId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Ticket"
                  options={tickets.map((t) => ({
                    value: t.id.toString(),
                    label: `TKT-${String(t.codigoInterno).padStart(5, '0')} - ${t.descripcion.substring(0, 40)}...`,
                    icon: <Ticket className="h-4 w-4" />,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sin vincular"
                />
              )}
            />
          </div>
        )}
      </form>
    </DialogBase>
  );
}
