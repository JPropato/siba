import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Save,
  FileText,
  CheckCircle2,
  XCircle,
  Lock,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import { usePermissions } from '../../../hooks/usePermissions';
import { useConfirm } from '../../../hooks/useConfirm';
import {
  useCreateRendicion,
  useCerrarRendicion,
  useAprobarRendicion,
  useRechazarRendicion,
} from '../hooks';
import { ESTADO_RENDICION_CONFIG, CATEGORIA_GASTO_CONFIG } from '../types';
import type { Rendicion, RendicionFormData } from '../types';

const rendicionSchema = z
  .object({
    tarjetaId: z.string().min(1, 'La tarjeta es requerida'),
    fechaDesde: z.string().min(1, 'La fecha desde es requerida'),
    fechaHasta: z.string().min(1, 'La fecha hasta es requerida'),
    observaciones: z.string().optional().or(z.literal('')),
  })
  .refine((data) => new Date(data.fechaHasta) >= new Date(data.fechaDesde), {
    message: 'La fecha hasta debe ser mayor o igual a la fecha desde',
    path: ['fechaHasta'],
  });

type RendicionFormValues = z.infer<typeof rendicionSchema>;

interface RendicionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Rendicion | null;
  tarjetaId?: number; // For create mode with pre-selected tarjeta
}

export default function RendicionDialog({
  isOpen,
  onClose,
  initialData,
  tarjetaId,
}: RendicionDialogProps) {
  const [tarjetas, setTarjetas] = useState<
    {
      id: number;
      alias: string | null;
      numeroTarjeta: string | null;
      empleado: { nombre: string; apellido: string };
    }[]
  >([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazoInput, setShowRechazoInput] = useState(false);

  const { hasPermission } = usePermissions();
  const canApprove = hasPermission('tarjetas:aprobar');
  const { confirm, ConfirmDialog } = useConfirm();

  const createRendicion = useCreateRendicion();
  const cerrarRendicion = useCerrarRendicion();
  const aprobarRendicion = useAprobarRendicion();
  const rechazarRendicion = useRechazarRendicion();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RendicionFormValues>({
    resolver: zodResolver(rendicionSchema),
    defaultValues: {
      tarjetaId: '',
      fechaDesde: '',
      fechaHasta: '',
      observaciones: '',
    },
  });

  const isViewMode = !!initialData;

  useEffect(() => {
    if (isOpen && !isViewMode) {
      // Fetch tarjetas for create mode
      const fetchData = async () => {
        setIsFetchingData(true);
        try {
          const res = await api.get('/tarjetas', { params: { estado: 'ACTIVA', limit: 100 } });
          setTarjetas(res.data.data || []);
        } catch (err) {
          console.error('Error fetching tarjetas:', err);
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchData();

      // Reset form
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      reset({
        tarjetaId: tarjetaId?.toString() || '',
        fechaDesde: firstDayOfMonth,
        fechaHasta: today,
        observaciones: '',
      });
    }
  }, [isOpen, isViewMode, reset, tarjetaId]);

  const onSubmit = async (values: RendicionFormValues) => {
    try {
      const data: RendicionFormData = {
        tarjetaId: Number(values.tarjetaId),
        fechaDesde: values.fechaDesde,
        fechaHasta: values.fechaHasta,
        observaciones: values.observaciones?.trim() || undefined,
      };

      await createRendicion.mutateAsync(data);
      toast.success('Rendición creada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al crear la rendición');
    }
  };

  const handleCerrar = async () => {
    if (!initialData) return;
    const ok = await confirm({
      title: 'Cerrar Rendición',
      message: 'Una vez cerrada, no se podrán agregar más gastos. ¿Desea continuar?',
      confirmLabel: 'Cerrar',
      variant: 'default',
    });
    if (!ok) return;

    try {
      await cerrarRendicion.mutateAsync(initialData.id);
      toast.success('Rendición cerrada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al cerrar la rendición');
    }
  };

  const handleAprobar = async () => {
    if (!initialData) return;
    const ok = await confirm({
      title: 'Aprobar Rendición',
      message: `¿Confirma la aprobación de la rendición ${initialData.codigo} por ${formatMoney(initialData.totalGastos)}?`,
      confirmLabel: 'Aprobar',
      variant: 'success',
    });
    if (!ok) return;

    try {
      await aprobarRendicion.mutateAsync(initialData.id);
      toast.success('Rendición aprobada correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al aprobar la rendición');
    }
  };

  const handleRechazar = async () => {
    if (!initialData) return;

    if (!showRechazoInput) {
      setShowRechazoInput(true);
      return;
    }

    if (!motivoRechazo.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }

    try {
      await rechazarRendicion.mutateAsync({
        id: initialData.id,
        motivoRechazo: motivoRechazo.trim(),
      });
      toast.success('Rendición rechazada');
      setShowRechazoInput(false);
      setMotivoRechazo('');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al rechazar la rendición');
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  // View mode footer
  const renderViewFooter = () => {
    if (!initialData) return null;

    const estado = initialData.estado;

    // ABIERTA: can close
    if (estado === 'ABIERTA') {
      return (
        <Button
          onClick={handleCerrar}
          isLoading={cerrarRendicion.isPending}
          leftIcon={<Lock className="h-[18px] w-[18px]" />}
        >
          Cerrar Rendición
        </Button>
      );
    }

    // CERRADA: can approve/reject (with permission)
    if (estado === 'CERRADA' && canApprove) {
      if (showRechazoInput) {
        return (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRechazoInput(false);
                setMotivoRechazo('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleRechazar}
              isLoading={rechazarRendicion.isPending}
              leftIcon={<XCircle className="h-[18px] w-[18px]" />}
            >
              Confirmar Rechazo
            </Button>
          </>
        );
      }

      return (
        <>
          <Button
            variant="outline"
            onClick={handleRechazar}
            isLoading={rechazarRendicion.isPending}
            leftIcon={<XCircle className="h-[18px] w-[18px]" />}
          >
            Rechazar
          </Button>
          <Button
            onClick={handleAprobar}
            isLoading={aprobarRendicion.isPending}
            leftIcon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          >
            Aprobar
          </Button>
        </>
      );
    }

    // APROBADA/RECHAZADA or no permission: close only
    return (
      <Button variant="ghost" onClick={onClose}>
        Cerrar
      </Button>
    );
  };

  // CREATE mode
  if (!isViewMode) {
    return (
      <>
        <DialogBase
          isOpen={isOpen}
          onClose={onClose}
          title="Nueva Rendición"
          description="Cree una nueva rendición de gastos para una tarjeta."
          maxWidth="lg"
          footer={
            <>
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="rendicion-form"
                isLoading={isSubmitting}
                leftIcon={<Save className="h-[18px] w-[18px]" />}
              >
                Crear Rendición
              </Button>
            </>
          }
        >
          <form id="rendicion-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="tarjetaId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tarjeta *"
                  options={tarjetas.map((t) => ({
                    value: t.id.toString(),
                    label: `${t.alias || t.numeroTarjeta || `Tarjeta #${t.id}`} - ${t.empleado.apellido}, ${t.empleado.nombre}`,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.tarjetaId?.message}
                  isLoading={isFetchingData}
                  placeholder="Seleccione una tarjeta"
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="fechaDesde"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Fecha Desde *"
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.fechaDesde?.message}
                  />
                )}
              />
              <Controller
                name="fechaHasta"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Fecha Hasta *"
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.fechaHasta?.message}
                  />
                )}
              />
            </div>

            <Input
              label="Observaciones"
              placeholder="Observaciones adicionales..."
              {...register('observaciones')}
              error={errors.observaciones?.message}
            />

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-slate-600 dark:text-slate-300">
              <strong>Nota:</strong> Se incluirán todos los gastos de la tarjeta en el rango de
              fechas seleccionado que aún no estén en otra rendición.
            </div>
          </form>
        </DialogBase>
        {ConfirmDialog}
      </>
    );
  }

  // VIEW mode
  const estadoConfig = ESTADO_RENDICION_CONFIG[initialData.estado];
  const gastos = initialData.gastos || [];

  return (
    <>
      <DialogBase
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            <span>{initialData.codigo}</span>
          </div>
        }
        description={
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoConfig.color}`}
            >
              {estadoConfig.label}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {initialData.tarjeta?.alias || initialData.tarjeta?.numeroTarjeta}
            </span>
          </div>
        }
        maxWidth="2xl"
        footer={renderViewFooter()}
      >
        <div className="space-y-6">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Período</div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">
                  {new Date(initialData.fechaDesde).toLocaleDateString('es-AR')} -{' '}
                  {new Date(initialData.fechaHasta).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-lg">{formatMoney(initialData.totalGastos)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Creado por</div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">
                  {initialData.creadoPor.apellido}, {initialData.creadoPor.nombre}
                </span>
              </div>
            </div>

            {initialData.aprobadoPor && (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Aprobado por</div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium">
                    {initialData.aprobadoPor.apellido}, {initialData.aprobadoPor.nombre}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {initialData.observaciones && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Observaciones</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {initialData.observaciones}
              </p>
            </div>
          )}

          {/* Motivo rechazo */}
          {initialData.motivoRechazo && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold">Motivo de Rechazo</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">{initialData.motivoRechazo}</p>
            </div>
          )}

          {/* Rechazo input (cuando se presiona rechazar) */}
          {showRechazoInput && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-2">
                Motivo de Rechazo *
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ingrese el motivo por el cual rechaza esta rendición..."
                className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Gastos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Gastos Incluidos ({gastos.length})
            </h4>
            {gastos.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Sin gastos en esta rendición</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {gastos.map((gasto) => {
                  const categoriaConfig = CATEGORIA_GASTO_CONFIG[gasto.categoria];
                  return (
                    <div
                      key={gasto.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            {categoriaConfig?.label || gasto.categoria}
                          </span>
                          {gasto.categoriaOtro && (
                            <span className="text-[9px] text-slate-500">
                              ({gasto.categoriaOtro})
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-sm text-red-600 dark:text-red-400">
                          -{formatMoney(gasto.monto)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                        {gasto.concepto}
                      </p>
                      {gasto.movimiento.cuentaContable && (
                        <div className="text-[9px] text-slate-500">
                          Imputa: {gasto.movimiento.cuentaContable.codigo} -{' '}
                          {gasto.movimiento.cuentaContable.nombre}
                        </div>
                      )}
                      {gasto.centroCosto && (
                        <div className="text-[9px] text-slate-500">
                          CC: {gasto.centroCosto.codigo} - {gasto.centroCosto.nombre}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogBase>
      {ConfirmDialog}
    </>
  );
}
