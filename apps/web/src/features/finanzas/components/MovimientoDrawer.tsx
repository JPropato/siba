import { useState, useEffect } from 'react';
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
import { CATEGORIA_INGRESO_LABELS, CATEGORIA_EGRESO_LABELS, MEDIO_PAGO_LABELS } from '../types';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  FileText,
  Building2,
  Ticket,
  Wrench,
  User,
} from 'lucide-react';
import api from '../../../lib/api';

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

const movimientoSchema = z.object({
  tipo: z.enum(['INGRESO', 'EGRESO']),
  cuentaId: z.string().min(1, 'Seleccione una cuenta'),
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
  descripcion: z.string().min(3, 'Ingrese una descripción'),
  clienteId: z.string().optional().or(z.literal('')),
  obraId: z.string().optional().or(z.literal('')),
  ticketId: z.string().optional().or(z.literal('')),
});

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

export default function MovimientoDrawer({ isOpen, onClose, onSuccess }: MovimientoDrawerProps) {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<ObraOption[]>([]);
  const [tickets, setTickets] = useState<TicketOption[]>([]);

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
    defaultValues: {
      tipo: 'INGRESO',
      cuentaId: '',
      monto: '',
      fechaMovimiento: new Date().toISOString().split('T')[0],
      medioPago: 'TRANSFERENCIA',
      categoriaIngreso: 'COBRO_FACTURA',
      categoriaEgreso: 'MATERIALES',
      comprobante: '',
      descripcion: '',
      clienteId: '',
      obraId: '',
      ticketId: '',
    },
  });

  const tipo = watch('tipo');
  const clienteId = watch('clienteId');

  useEffect(() => {
    if (isOpen) {
      reset({
        tipo: 'INGRESO',
        cuentaId: '',
        monto: '',
        fechaMovimiento: new Date().toISOString().split('T')[0],
        medioPago: 'TRANSFERENCIA',
        categoriaIngreso: 'COBRO_FACTURA',
        categoriaEgreso: 'MATERIALES',
        comprobante: '',
        descripcion: '',
        clienteId: '',
        obraId: '',
        ticketId: '',
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
      const data = {
        tipo: values.tipo as TipoMovimiento,
        cuentaId: Number(values.cuentaId),
        monto: Number(values.monto),
        fechaMovimiento: new Date(values.fechaMovimiento).toISOString(),
        medioPago: values.medioPago as MedioPago,
        categoriaIngreso: values.tipo === 'INGRESO' ? values.categoriaIngreso : null,
        categoriaEgreso: values.tipo === 'EGRESO' ? values.categoriaEgreso : null,
        comprobante: values.comprobante || null,
        descripcion: values.descripcion,
        clienteId: values.clienteId ? Number(values.clienteId) : null,
        obraId: values.obraId ? Number(values.obraId) : null,
        ticketId: values.ticketId ? Number(values.ticketId) : null,
      };
      await finanzasApi.createMovimiento(data);
      toast.success(`${values.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado correctamente`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating movimiento:', error);
      toast.error('Error al crear el movimiento');
    }
  };

  // onSubmit...

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      type="drawer"
      title="Nuevo Movimiento"
      description={tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar egreso'}
      icon={
        <div
          className={`p-2 rounded-xl ${tipo === 'INGRESO' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
        >
          {tipo === 'INGRESO' ? (
            <ArrowUpCircle className="h-5 w-5" />
          ) : (
            <ArrowDownCircle className="h-5 w-5" />
          )}
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
            className={
              tipo === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Registrar {tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
          </Button>
        </>
      }
    >
      <form id="movimiento-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tipo Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo de Movimiento *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold cursor-pointer transition-all ${tipo === 'INGRESO' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
            >
              <input type="radio" value="INGRESO" {...register('tipo')} className="sr-only" />
              <ArrowUpCircle className="h-5 w-5" /> INGRESO
            </label>
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold cursor-pointer transition-all ${tipo === 'EGRESO' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
            >
              <input type="radio" value="EGRESO" {...register('tipo')} className="sr-only" />
              <ArrowDownCircle className="h-5 w-5" /> EGRESO
            </label>
          </div>
        </div>

        {/* Cuenta */}
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

        {/* Medio de Pago */}
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

        {/* Categoría */}
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

        {/* Comprobante */}
        <Input
          label="Comprobante"
          placeholder="Nro de factura, recibo, etc."
          leftIcon={<FileText className="h-4 w-4" />}
          {...register('comprobante')}
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
            placeholder="Detalle del movimiento..."
            {...register('descripcion')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand resize-none text-slate-900 dark:text-white"
          />
          {errors.descripcion && (
            <p role="alert" className="text-[11px] font-medium text-red-500">
              {errors.descripcion.message}
            </p>
          )}
        </div>

        {/* Vinculaciones */}
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
      </form>
    </DialogBase>
  );
}
