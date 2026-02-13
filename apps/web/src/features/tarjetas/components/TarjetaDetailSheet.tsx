import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '../../../components/ui/Sheet';
import {
  CreditCard,
  Building2,
  User,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useTarjeta,
  useCargas,
  useGastos,
  useCreateCarga,
  useCreateGasto,
  useUpdateGasto,
  useDeleteGasto,
} from '../hooks';
import { useConfirm } from '../../../hooks/useConfirm';
import {
  TIPO_TARJETA_CONFIG,
  ESTADO_TARJETA_CONFIG,
  CATEGORIA_GASTO_CONFIG,
  ESTADO_RENDICION_CONFIG,
  TIPO_TARJETA_FINANCIERA_CONFIG,
  RED_PROCESADORA_CONFIG,
} from '../types';
import type { TarjetaPrecargable, GastoTarjeta, CargaFormData, GastoFormData } from '../types';
import CargaDialog from './CargaDialog';
import GastoDialog from './GastoDialog';

const BADGE_CLASSES: Record<string, string> = {
  green:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  amber:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  purple:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
};

interface Props {
  tarjeta: TarjetaPrecargable | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TarjetaDetailSheet({ tarjeta, isOpen, onClose }: Props) {
  const [cargaDialogOpen, setCargaDialogOpen] = useState(false);
  const [gastoDialogOpen, setGastoDialogOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<GastoTarjeta | null>(null);

  const { data: tarjetaDetail } = useTarjeta(tarjeta?.id ?? null);
  const { data: cargasData, isLoading: cargasLoading } = useCargas(tarjeta?.id ?? null);
  const { data: gastosData, isLoading: gastosLoading } = useGastos(tarjeta?.id ?? null);

  const createCarga = useCreateCarga();
  const createGasto = useCreateGasto();
  const updateGasto = useUpdateGasto();
  const deleteGasto = useDeleteGasto();
  const { confirm, ConfirmDialog } = useConfirm();

  if (!tarjeta) return null;

  const tipoConfig = TIPO_TARJETA_CONFIG[tarjeta.tipo];
  const estadoConfig = ESTADO_TARJETA_CONFIG[tarjeta.estado];

  const saldo =
    tarjetaDetail?.cuentaFinanciera?.saldoActual ?? tarjeta.cuentaFinanciera.saldoActual;
  const saldoColor =
    saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const cargas = cargasData?.data || [];
  const gastos = gastosData?.data || [];
  const rendiciones = tarjetaDetail?.rendiciones || [];

  const handleCreateCarga = () => {
    setCargaDialogOpen(true);
  };

  const handleSaveCarga = async (data: CargaFormData) => {
    await createCarga.mutateAsync({ tarjetaId: tarjeta.id, data });
  };

  const handleCreateGasto = () => {
    setSelectedGasto(null);
    setGastoDialogOpen(true);
  };

  const handleEditGasto = (gasto: GastoTarjeta) => {
    setSelectedGasto(gasto);
    setGastoDialogOpen(true);
  };

  const handleDeleteGasto = async (gasto: GastoTarjeta) => {
    const ok = await confirm({
      title: 'Eliminar gasto',
      message: '¿Está seguro de eliminar este gasto?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteGasto.mutateAsync(gasto.id);
      toast.success('Gasto eliminado');
    } catch {
      toast.error('Error al eliminar gasto');
    }
  };

  const handleSaveGasto = async (data: GastoFormData) => {
    if (selectedGasto) {
      await updateGasto.mutateAsync({ gastoId: selectedGasto.id, data });
    } else {
      await createGasto.mutateAsync({ tarjetaId: tarjeta.id, data });
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand" />
              {tarjeta.alias || tarjeta.numeroTarjeta || 'Tarjeta'}
            </SheetTitle>
            <SheetDescription>
              {tarjeta.empleado.apellido}, {tarjeta.empleado.nombre} — Saldo:{' '}
              <span className={saldoColor}>{formatMoney(saldo)}</span>
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="space-y-6 pt-4">
            {/* Saldo destacado */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Actual</div>
              <div className={`text-3xl font-bold ${saldoColor}`}>{formatMoney(saldo)}</div>
            </div>

            {/* Info básica */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Información
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${tipoConfig.color}`}
                >
                  {tipoConfig.label}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${estadoConfig.color}`}
                >
                  {estadoConfig.label}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Titular:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {tarjeta.empleado.apellido}, {tarjeta.empleado.nombre}
                  </span>
                </div>
                {tarjeta.banco && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Banco:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {tarjeta.banco.nombre || tarjeta.banco.nombreCorto}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Cuenta Financiera:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {tarjeta.cuentaFinanciera.nombre}
                  </span>
                </div>
                {tarjeta.numeroTarjeta && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Número:</span>
                    <span className="font-medium text-slate-900 dark:text-white font-mono">
                      {tarjeta.numeroTarjeta}
                    </span>
                  </div>
                )}
                {tarjeta.tipoTarjetaFinanciera && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Tipo Financiero:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {TIPO_TARJETA_FINANCIERA_CONFIG[tarjeta.tipoTarjetaFinanciera]?.label}
                    </span>
                  </div>
                )}
                {tarjeta.redProcesadora && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Red:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {RED_PROCESADORA_CONFIG[tarjeta.redProcesadora]?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cargas (only for PRECARGABLE) */}
            {tarjeta.tipo === 'PRECARGABLE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Cargas ({cargas.length})
                  </h4>
                  <button
                    onClick={handleCreateCarga}
                    className="flex items-center gap-1 px-2 py-1 bg-brand hover:bg-brand-dark text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    <Plus className="h-3 w-3" /> Nueva
                  </button>
                </div>

                {cargasLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 text-brand animate-spin" />
                  </div>
                ) : cargas.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Sin cargas registradas</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {cargas.map((carga) => (
                      <div
                        key={carga.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {new Date(carga.fecha).toLocaleDateString('es-AR')}
                          </span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            +{formatMoney(carga.monto)}
                          </span>
                        </div>
                        {carga.descripcion && (
                          <p className="text-[10px] text-slate-500">{carga.descripcion}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400">
                            Mov: {carga.movimiento.codigo}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              carga.movimiento.estado === 'CONFIRMADO'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}
                          >
                            {carga.movimiento.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gastos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Gastos ({gastos.length})
                </h4>
                <button
                  onClick={handleCreateGasto}
                  className="flex items-center gap-1 px-2 py-1 bg-brand hover:bg-brand-dark text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  <Plus className="h-3 w-3" /> Nuevo
                </button>
              </div>

              {gastosLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-brand animate-spin" />
                </div>
              ) : gastos.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Sin gastos registrados</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {gastos.map((gasto) => {
                    const canEdit = true; // Simplified for now - can add rendicion check later if needed
                    return (
                      <div
                        key={gasto.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${BADGE_CLASSES.blue}`}
                            >
                              {CATEGORIA_GASTO_CONFIG[gasto.categoria]?.label || gasto.categoria}
                            </span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditGasto(gasto)}
                                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-brand rounded transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteGasto(gasto)}
                                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                          </span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            -{formatMoney(gasto.monto)}
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
                        {gasto.ticket && (
                          <div className="flex items-center gap-1 text-[9px] text-blue-600 dark:text-blue-400">
                            <ExternalLink className="h-3 w-3" />
                            Ticket #{gasto.ticket.codigoInterno.toString().padStart(4, '0')}
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

            {/* Rendiciones */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Rendiciones ({rendiciones.length})
              </h4>
              {rendiciones.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Sin rendiciones</p>
              ) : (
                <div className="space-y-2">
                  {rendiciones.slice(0, 5).map((rendicion) => {
                    const estadoConfig = ESTADO_RENDICION_CONFIG[rendicion.estado];
                    return (
                      <div
                        key={rendicion.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {rendicion.codigo}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${estadoConfig.color}`}
                          >
                            {estadoConfig.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(rendicion.fechaDesde).toLocaleDateString('es-AR')} -{' '}
                          {new Date(rendicion.fechaHasta).toLocaleDateString('es-AR')}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{rendicion.cantidadGastos} gastos</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatMoney(rendicion.totalGastos)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <CargaDialog
        isOpen={cargaDialogOpen}
        onClose={() => setCargaDialogOpen(false)}
        onSave={handleSaveCarga}
      />

      <GastoDialog
        isOpen={gastoDialogOpen}
        onClose={() => setGastoDialogOpen(false)}
        onSave={handleSaveGasto}
        initialData={selectedGasto}
        tarjetaId={tarjeta?.id || 0}
      />

      {ConfirmDialog}
    </>
  );
}
