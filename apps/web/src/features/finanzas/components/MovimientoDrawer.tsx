import { useState, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { finanzasApi } from '../api/finanzasApi';
import type {
  CuentaFinanciera,
  CuentaContable,
  CentroCosto,
  TipoMovimiento,
  MedioPago,
} from '../types';
import { MEDIO_PAGO_LABELS, MEDIO_PAGO_POR_DEFECTO } from '../types';
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
  CreditCard,
  Tag,
  Link2,
  AlignLeft,
  BookOpen,
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
    cuentaContableId: z.string().optional().or(z.literal('')),
    centroCostoId: z.string().optional().or(z.literal('')),
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
    shortLabel: string;
    activeClass: string;
    bgColor: string;
    textColor: string;
    icon: React.ReactNode;
    buttonClass: string;
    buttonLabel: string;
    description: string;
    accentBorder: string;
  }
> = {
  INGRESO: {
    label: 'Ingreso',
    shortLabel: 'Ingreso',
    activeClass:
      'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 ring-2 ring-green-500/20',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    icon: <ArrowUpCircle className="h-5 w-5" />,
    buttonClass: 'bg-green-600 hover:bg-green-700',
    buttonLabel: 'Registrar Ingreso',
    description: 'Dinero que entra a la cuenta',
    accentBorder: 'border-l-green-500',
  },
  EGRESO: {
    label: 'Egreso',
    shortLabel: 'Egreso',
    activeClass:
      'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 ring-2 ring-red-500/20',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    icon: <ArrowDownCircle className="h-5 w-5" />,
    buttonClass: 'bg-red-600 hover:bg-red-700',
    buttonLabel: 'Registrar Egreso',
    description: 'Dinero que sale de la cuenta',
    accentBorder: 'border-l-red-500',
  },
  TRANSFERENCIA: {
    label: 'Transferencia',
    shortLabel: 'Transf.',
    activeClass:
      'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 ring-2 ring-indigo-500/20',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    icon: <ArrowLeftRight className="h-5 w-5" />,
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700',
    buttonLabel: 'Registrar Transferencia',
    description: 'Mover dinero entre cuentas',
    accentBorder: 'border-l-indigo-500',
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
  cuentaContableId: '',
  centroCostoId: '',
  comprobante: '',
  comprobanteUrl: null,
  descripcion: '',
  clienteId: '',
  obraId: '',
  ticketId: '',
};

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <div className="text-slate-400">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function MovimientoDrawer({ isOpen, onClose, onSuccess }: MovimientoDrawerProps) {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
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
  const cuentaDestinoIdValue = watch('cuentaDestinoId');
  const clienteId = watch('clienteId');

  const isTransferencia = tipo === 'TRANSFERENCIA';
  const config = TIPO_CONFIG[tipo];

  const cuentaSeleccionada = cuentas.find((c) => c.id.toString() === cuentaIdValue);
  const cuentaOrigen = cuentas.find((c) => c.id.toString() === cuentaOrigenIdValue);
  const cuentaDestino = cuentas.find((c) => c.id.toString() === cuentaDestinoIdValue);

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
    const fetchCuentasContables = async () => {
      try {
        const data = await finanzasApi.getCuentasContables({ imputable: true });
        setCuentasContables(data);
      } catch (e) {
        console.error(e);
      }
    };
    const fetchCentrosCosto = async () => {
      try {
        const data = await finanzasApi.getCentrosCosto();
        setCentrosCosto(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCuentas();
    fetchCuentasContables();
    fetchCentrosCosto();
  }, []);

  useEffect(() => {
    if (cuentaIdValue && !isTransferencia) {
      const cuenta = cuentas.find((c) => c.id.toString() === cuentaIdValue);
      if (cuenta) {
        const medioPago = MEDIO_PAGO_POR_DEFECTO[cuenta.tipo];
        // Filter out ECHEQ as it's only valid for cheques module
        if (medioPago !== 'ECHEQ') {
          setValue(
            'medioPago',
            medioPago as
              | 'EFECTIVO'
              | 'TRANSFERENCIA'
              | 'CHEQUE'
              | 'TARJETA_DEBITO'
              | 'TARJETA_CREDITO'
              | 'MERCADOPAGO'
          );
        }
      }
    }
  }, [cuentaIdValue, cuentas, setValue, isTransferencia]);

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
          cuentaContableId: values.cuentaContableId ? Number(values.cuentaContableId) : null,
          centroCostoId: values.centroCostoId ? Number(values.centroCostoId) : null,
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

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      type="drawer"
      maxWidth="xl"
      title="Nuevo Movimiento"
      description={config.description}
      icon={
        <div className={`p-2.5 rounded-xl ${config.bgColor} ${config.textColor}`}>
          {config.icon}
        </div>
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
      <form id="movimiento-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ═══ TIPO DE OPERACION ═══ */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
            Tipo de Operacion
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {(['INGRESO', 'EGRESO', 'TRANSFERENCIA'] as TipoOperacion[]).map((t) => {
              const c = TIPO_CONFIG[t];
              const isActive = tipo === t;
              return (
                <label
                  key={t}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isActive
                      ? c.activeClass
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input type="radio" value={t} {...register('tipo')} className="sr-only" />
                  <span className={isActive ? '' : 'opacity-50'}>{c.icon}</span>
                  <span className="text-xs font-bold hidden sm:block">{c.label}</span>
                  <span className="text-xs font-bold sm:hidden">{c.shortLabel}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ═══ SECCION: CUENTAS ═══ */}
        <div
          className={`rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${config.accentBorder} p-4 space-y-4`}
        >
          <SectionHeader
            icon={<Building2 className="h-4 w-4" />}
            title={isTransferencia ? 'Cuentas' : 'Cuenta'}
            subtitle={
              isTransferencia
                ? 'Selecciona las cuentas origen y destino'
                : 'Selecciona la cuenta para este movimiento'
            }
          />

          {isTransferencia ? (
            <div className="space-y-3">
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
                        description: `${c.banco?.nombreCorto || c.tipo} · ${formatCurrency(c.saldoActual)}`,
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
                    Saldo:{' '}
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(cuentaOrigen.saldoActual)}
                    </span>
                  </p>
                )}
              </div>

              {/* Flecha visual */}
              <div className="flex justify-center py-1">
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
                          description: `${c.banco?.nombreCorto || c.tipo} · ${formatCurrency(c.saldoActual)}`,
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
                    Saldo:{' '}
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(cuentaDestino.saldoActual)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Controller
                name="cuentaId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Cuenta *"
                    options={cuentas.map((c) => ({
                      value: c.id.toString(),
                      label: c.nombre,
                      description: `${c.banco?.nombreCorto || c.tipo} · ${formatCurrency(c.saldoActual)}`,
                      icon: <Building2 className="h-4 w-4" />,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.cuentaId?.message}
                    placeholder="Seleccionar cuenta..."
                  />
                )}
              />
              {cuentaSeleccionada && (
                <p className="text-xs text-slate-500 pl-1">
                  Saldo actual:{' '}
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(cuentaSeleccionada.saldoActual)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* ═══ SECCION: MONTO Y FECHA ═══ */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <SectionHeader
            icon={<DollarSign className="h-4 w-4" />}
            title="Monto y Fecha"
            subtitle="Datos principales del movimiento"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="monto-input"
                className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"
              >
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  $
                </span>
                <input
                  id="monto-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('monto')}
                  className="w-full h-11 pl-7 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-base font-semibold outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 tabular-nums text-slate-900 dark:text-white transition-all"
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
        </div>

        {/* ═══ SECCION: CLASIFICACION (solo INGRESO/EGRESO) ═══ */}
        {!isTransferencia && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <SectionHeader
              icon={<Tag className="h-4 w-4" />}
              title="Clasificacion"
              subtitle="Medio de pago, cuenta contable y centro de costo"
            />
            <Controller
              name="medioPago"
              control={control}
              render={({ field }) => (
                <Select
                  label="Medio de Pago *"
                  options={MEDIOS_PAGO.map((mp) => ({
                    value: mp,
                    label: MEDIO_PAGO_LABELS[mp],
                    icon: <CreditCard className="h-4 w-4" />,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="cuentaContableId"
              control={control}
              render={({ field }) => {
                // Sort: show relevant type first (INGRESO→INGRESO cuentas, EGRESO→GASTO cuentas)
                const sorted = [...cuentasContables].sort((a, b) => {
                  const preferred = tipo === 'INGRESO' ? 'INGRESO' : 'GASTO';
                  if (a.tipo === preferred && b.tipo !== preferred) return -1;
                  if (a.tipo !== preferred && b.tipo === preferred) return 1;
                  return a.codigo.localeCompare(b.codigo);
                });
                return (
                  <Select
                    label="Cuenta Contable"
                    options={sorted.map((cc) => ({
                      value: cc.id.toString(),
                      label: `${cc.codigo} - ${cc.nombre}`,
                      description: cc.parent?.nombre,
                      icon: <BookOpen className="h-4 w-4" />,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sin clasificar"
                  />
                );
              }}
            />
            <Controller
              name="centroCostoId"
              control={control}
              render={({ field }) => {
                // Only show leaf nodes (centros without children)
                const parentIds = new Set(
                  centrosCosto.filter((c) => c.parentId).map((c) => c.parentId)
                );
                const leafCentros = centrosCosto.filter((c) => !parentIds.has(c.id));
                return (
                  <Select
                    label="Centro de Costo"
                    options={leafCentros.map((cc) => ({
                      value: cc.id.toString(),
                      label: cc.nombre,
                      description: cc.parent?.nombre,
                      icon: <Building2 className="h-4 w-4" />,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sin asignar"
                  />
                );
              }}
            />
          </div>
        )}

        {/* ═══ SECCION: DETALLE ═══ */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <SectionHeader
            icon={<AlignLeft className="h-4 w-4" />}
            title="Detalle"
            subtitle="Descripcion y comprobante del movimiento"
          />

          <div className="space-y-1.5">
            <label
              htmlFor="descripcion-input"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Descripcion *
            </label>
            <textarea
              id="descripcion-input"
              rows={3}
              placeholder={
                isTransferencia
                  ? 'Motivo de la transferencia entre cuentas...'
                  : tipo === 'INGRESO'
                    ? 'Ej: Cobro factura A-0001-00012345 de Cliente X...'
                    : 'Ej: Compra de materiales para obra OBR-001...'
              }
              {...register('descripcion')}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none text-slate-900 dark:text-white transition-all"
            />
            {errors.descripcion && (
              <p role="alert" className="text-[11px] font-medium text-red-500">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nro. Comprobante"
              placeholder="Factura, recibo, etc."
              leftIcon={<FileText className="h-4 w-4" />}
              {...register('comprobante')}
            />

            {/* Adjuntar archivo */}
            <Controller
              name="comprobanteUrl"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Adjuntar Archivo
                  </label>
                  {field.value ? (
                    <div className="flex items-center gap-2 p-2.5 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
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
                        className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 w-full h-10 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
                    >
                      {isUploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      {isUploadingFile ? 'Subiendo...' : 'Adjuntar PDF o imagen'}
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
          </div>
        </div>

        {/* ═══ SECCION: VINCULACIONES (solo INGRESO/EGRESO) ═══ */}
        {!isTransferencia && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <SectionHeader
              icon={<Link2 className="h-4 w-4" />}
              title="Vinculaciones"
              subtitle="Opcional: vincular a un cliente, obra o ticket"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="Sin vincular"
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
            </div>

            <Controller
              name="ticketId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Ticket"
                  options={tickets.map((t) => ({
                    value: t.id.toString(),
                    label: `TKT-${String(t.codigoInterno).padStart(5, '0')} - ${t.descripcion.substring(0, 50)}`,
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
