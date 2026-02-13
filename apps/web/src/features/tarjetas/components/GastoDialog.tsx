import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Info, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import { useConfigCategorias, useProveedoresFrecuentes } from '../hooks';
import { CATEGORIA_GASTO_CONFIG, TIPO_COMPROBANTE_CONFIG, CONDICION_IVA_CONFIG } from '../types';
import type { GastoTarjeta, GastoFormData, CategoriaGastoTarjeta } from '../types';

const gastoSchema = z
  .object({
    categoria: z.string().min(1, 'La categoría es requerida'),
    categoriaOtro: z.string().optional().or(z.literal('')),
    monto: z.string().min(1, 'El monto es requerido'),
    fecha: z.string().min(1, 'La fecha es requerida'),
    concepto: z.string().min(1, 'El concepto es requerido'),
    centroCostoId: z.string().optional().or(z.literal('')),
    ticketId: z.string().optional().or(z.literal('')),
    // Proveedor (MANDATORY - either select existing or create new)
    proveedorId: z.string().optional().or(z.literal('')),
    proveedorRazonSocial: z.string().optional().or(z.literal('')),
    proveedorCuit: z.string().optional().or(z.literal('')),
    proveedorCondicionIva: z.string().optional().or(z.literal('')),
    // Factura
    facturaTipoComprobante: z.string().optional().or(z.literal('')),
    facturaPuntoVenta: z.string().optional().or(z.literal('')),
    facturaNumeroComprobante: z.string().optional().or(z.literal('')),
    facturaFechaEmision: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Must provide either proveedorId OR all new proveedor fields
      const hasProveedorId = data.proveedorId && data.proveedorId.trim() !== '';
      const hasNewProveedor =
        data.proveedorRazonSocial &&
        data.proveedorRazonSocial.trim() !== '' &&
        data.proveedorCuit &&
        data.proveedorCuit.trim() !== '' &&
        data.proveedorCondicionIva &&
        data.proveedorCondicionIva.trim() !== '';
      return hasProveedorId || hasNewProveedor;
    },
    {
      message: 'Debe seleccionar un proveedor existente o ingresar los datos de uno nuevo',
      path: ['proveedorId'],
    }
  );

type GastoFormValues = z.infer<typeof gastoSchema>;

interface GastoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GastoFormData) => Promise<void>;
  initialData?: GastoTarjeta | null;
  tarjetaId: number;
}

export default function GastoDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  tarjetaId,
}: GastoDialogProps) {
  const [centrosCosto, setCentrosCosto] = useState<
    { id: number; codigo: string; nombre: string }[]
  >([]);
  const [tickets, setTickets] = useState<
    { id: number; codigoInterno: number; descripcion?: string }[]
  >([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showNewProveedor, setShowNewProveedor] = useState(false);

  const { data: configCategorias } = useConfigCategorias();
  const { data: proveedoresFrecuentes, isLoading: isLoadingProveedores } = useProveedoresFrecuentes(
    isOpen ? tarjetaId : null
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      categoria: '',
      categoriaOtro: '',
      monto: '',
      fecha: '',
      concepto: '',
      centroCostoId: '',
      ticketId: '',
      proveedorId: '',
      proveedorRazonSocial: '',
      proveedorCuit: '',
      proveedorCondicionIva: '',
      facturaTipoComprobante: '',
      facturaPuntoVenta: '',
      facturaNumeroComprobante: '',
      facturaFechaEmision: '',
    },
  });

  const selectedCategoria = watch('categoria') as CategoriaGastoTarjeta;
  const selectedProveedorId = watch('proveedorId');

  useEffect(() => {
    if (isOpen) {
      // Fetch data
      const fetchData = async () => {
        setIsFetchingData(true);
        try {
          const [ccRes, ticketsRes] = await Promise.all([
            api.get('/finanzas/centros-costo', { params: { activo: true, limit: 100 } }),
            api.get('/tickets', { params: { limit: 50, estado: 'EN_CURSO' } }),
          ]);
          setCentrosCosto(ccRes.data.data || []);
          setTickets(ticketsRes.data.data || []);
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchData();

      // Reset form
      if (initialData) {
        reset({
          categoria: initialData.categoria,
          categoriaOtro: initialData.categoriaOtro || '',
          monto: initialData.monto?.toString() || '',
          fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : '',
          concepto: initialData.concepto || '',
          centroCostoId: initialData.centroCostoId?.toString() || '',
          ticketId: initialData.ticketId?.toString() || '',
          proveedorId: initialData.proveedorId?.toString() || '',
          proveedorRazonSocial: '',
          proveedorCuit: '',
          proveedorCondicionIva: '',
          facturaTipoComprobante: initialData.facturaProveedor?.tipoComprobante?.toString() || '',
          facturaPuntoVenta: initialData.facturaProveedor?.puntoVenta?.toString() || '',
          facturaNumeroComprobante: initialData.facturaProveedor?.numeroComprobante || '',
          facturaFechaEmision: '',
        });
        setShowNewProveedor(false);
      } else {
        reset({
          categoria: '',
          categoriaOtro: '',
          monto: '',
          fecha: new Date().toISOString().split('T')[0],
          concepto: '',
          centroCostoId: '',
          ticketId: '',
          proveedorId: '',
          proveedorRazonSocial: '',
          proveedorCuit: '',
          proveedorCondicionIva: '',
          facturaTipoComprobante: '',
          facturaPuntoVenta: '',
          facturaNumeroComprobante: '',
          facturaFechaEmision: new Date().toISOString().split('T')[0],
        });
        setShowNewProveedor(false);
      }
    }
  }, [isOpen, initialData, reset]);

  // Watch proveedorId to toggle new proveedor form
  useEffect(() => {
    if (selectedProveedorId === '__NEW__') {
      setShowNewProveedor(true);
    } else {
      setShowNewProveedor(false);
      // Clear proveedor fields when selecting existing
      if (selectedProveedorId) {
        setValue('proveedorRazonSocial', '');
        setValue('proveedorCuit', '');
        setValue('proveedorCondicionIva', '');
      }
    }
  }, [selectedProveedorId, setValue]);

  const onSubmit = async (values: GastoFormValues) => {
    try {
      const payload: GastoFormData = {
        categoria: values.categoria as CategoriaGastoTarjeta,
        categoriaOtro: values.categoriaOtro?.trim() || undefined,
        monto: Number(values.monto),
        fecha: values.fecha,
        concepto: values.concepto.trim(),
        centroCostoId: values.centroCostoId ? Number(values.centroCostoId) : undefined,
        ticketId: values.ticketId ? Number(values.ticketId) : undefined,
      };

      // Add proveedor data
      if (showNewProveedor && values.proveedorRazonSocial && values.proveedorCuit) {
        payload.proveedor = {
          razonSocial: values.proveedorRazonSocial.trim(),
          cuit: values.proveedorCuit.trim(),
          condicionIva: values.proveedorCondicionIva as
            | 'RESPONSABLE_INSCRIPTO'
            | 'MONOTRIBUTISTA'
            | 'EXENTO'
            | 'CONSUMIDOR_FINAL',
        };
      } else if (values.proveedorId && values.proveedorId !== '__NEW__') {
        payload.proveedorId = Number(values.proveedorId);
      }

      // Add factura data if provided
      if (
        values.facturaTipoComprobante &&
        values.facturaPuntoVenta &&
        values.facturaNumeroComprobante
      ) {
        payload.factura = {
          tipoComprobante: values.facturaTipoComprobante as
            | 'FACTURA_A'
            | 'FACTURA_B'
            | 'FACTURA_C'
            | 'FACTURA_E'
            | 'NOTA_CREDITO'
            | 'NOTA_DEBITO'
            | 'RECIBO'
            | 'OTRO',
          puntoVenta: Number(values.facturaPuntoVenta),
          numeroComprobante: values.facturaNumeroComprobante.trim(),
          fechaEmision: values.facturaFechaEmision || values.fecha,
        };
      }

      await onSave(payload);
      toast.success(initialData ? 'Gasto actualizado' : 'Gasto registrado correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al guardar el gasto');
    }
  };

  // Find the cuenta contable for the selected category
  const selectedCuentaContable = configCategorias?.find(
    (c) => c.categoria === selectedCategoria
  )?.cuentaContable;

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
      description="Registre un gasto realizado con la tarjeta."
      maxWidth="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="gasto-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form id="gasto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <Select
                label="Categoría *"
                options={Object.entries(CATEGORIA_GASTO_CONFIG).map(([value, config]) => ({
                  value,
                  label: config.label,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.categoria?.message}
              />
            )}
          />
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('monto')}
            error={errors.monto?.message}
          />
        </div>

        {selectedCategoria === 'OTRO' && (
          <Input
            label="Especificar categoría *"
            placeholder="Indique la categoría del gasto..."
            {...register('categoriaOtro')}
            error={errors.categoriaOtro?.message}
          />
        )}

        {selectedCuentaContable && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-medium">Imputa a: </span>
              <span className="text-blue-700 dark:text-blue-300">
                {selectedCuentaContable.codigo} - {selectedCuentaContable.nombre}
              </span>
            </div>
          </div>
        )}

        <Controller
          name="fecha"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Fecha *"
              value={field.value || ''}
              onChange={field.onChange}
              error={errors.fecha?.message}
            />
          )}
        />

        <Input
          label="Concepto *"
          placeholder="Descripción del gasto..."
          {...register('concepto')}
          error={errors.concepto?.message}
        />

        {/* Proveedor Section */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Proveedor (Opcional)
            </h4>
          </div>

          <Controller
            name="proveedorId"
            control={control}
            render={({ field }) => (
              <Select
                label="Proveedor"
                options={[
                  ...(proveedoresFrecuentes?.map((p) => ({
                    value: p.id.toString(),
                    label: `${p.razonSocial} (${p.cuit})${p.vecesUsado ? ` - ${p.vecesUsado} veces` : ''}`,
                  })) || []),
                  { value: '__NEW__', label: '+ Nuevo Proveedor' },
                ]}
                value={field.value}
                onChange={field.onChange}
                isLoading={isLoadingProveedores}
                placeholder="Seleccione un proveedor..."
              />
            )}
          />

          {showNewProveedor && (
            <div className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <Plus className="h-3.5 w-3.5" />
                Datos del nuevo proveedor
              </div>
              <Input
                label="Razón Social *"
                placeholder="Nombre o razón social..."
                {...register('proveedorRazonSocial')}
                error={errors.proveedorRazonSocial?.message}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="CUIT *"
                  placeholder="20-12345678-9"
                  {...register('proveedorCuit')}
                  error={errors.proveedorCuit?.message}
                />
                <Controller
                  name="proveedorCondicionIva"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Condición IVA *"
                      options={Object.entries(CONDICION_IVA_CONFIG).map(([value, config]) => ({
                        value,
                        label: config.label,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.proveedorCondicionIva?.message}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Factura Section */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Comprobante (Opcional)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="facturaTipoComprobante"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Comprobante"
                  options={Object.entries(TIPO_COMPROBANTE_CONFIG).map(([value, config]) => ({
                    value,
                    label: config.label,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccione..."
                />
              )}
            />
            <Input
              label="Punto de Venta"
              type="number"
              placeholder="Ej: 1"
              {...register('facturaPuntoVenta')}
              error={errors.facturaPuntoVenta?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número de Comprobante"
              placeholder="Ej: 00001234"
              {...register('facturaNumeroComprobante')}
              error={errors.facturaNumeroComprobante?.message}
            />
            <Controller
              name="facturaFechaEmision"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Fecha de Emisión"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="centroCostoId"
            control={control}
            render={({ field }) => (
              <Select
                label="Centro de Costo"
                options={centrosCosto.map((cc) => ({
                  value: cc.id.toString(),
                  label: `${cc.codigo} - ${cc.nombre}`,
                }))}
                value={field.value}
                onChange={field.onChange}
                isLoading={isFetchingData}
                placeholder="Sin asignar"
              />
            )}
          />
          <Controller
            name="ticketId"
            control={control}
            render={({ field }) => (
              <Select
                label="Ticket Asociado"
                options={tickets.map((t) => ({
                  value: t.id.toString(),
                  label: `#${t.codigoInterno.toString().padStart(4, '0')}${t.descripcion ? ` - ${t.descripcion.slice(0, 30)}` : ''}`,
                }))}
                value={field.value}
                onChange={field.onChange}
                isLoading={isFetchingData}
                placeholder="Sin asignar"
              />
            )}
          />
        </div>
      </form>
    </DialogBase>
  );
}
