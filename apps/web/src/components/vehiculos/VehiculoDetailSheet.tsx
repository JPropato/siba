import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from '../ui/Sheet';
import { Wrench, Users, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMultasVehiculo,
  useCreateMulta,
  useUpdateMulta,
  useDeleteMulta,
} from '../../hooks/api/useVehiculos';
import { useConfirm } from '../../hooks/useConfirm';
import { getOilChangeStatus, getVTVStatus, getLicenseStatus } from '../../utils/vehiculoAlarms';
import { TIPO_MULTA_CONFIG, ESTADO_MULTA_CONFIG } from '../../types/vehiculos';
import type {
  Vehiculo,
  MultaVehiculo,
  MultaVehiculoFormData,
  EstadoMultaVehiculo,
} from '../../types/vehiculos';
import MultaDialog from './MultaDialog';

const BADGE_CLASSES: Record<string, string> = {
  green:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  amber:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  orange:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
};

interface Props {
  vehiculo: Vehiculo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VehiculoDetailSheet({ vehiculo, isOpen, onClose }: Props) {
  const [multaDialogOpen, setMultaDialogOpen] = useState(false);
  const [selectedMulta, setSelectedMulta] = useState<MultaVehiculo | null>(null);

  const { data: multas, isLoading: multasLoading } = useMultasVehiculo(vehiculo?.id ?? 0);
  const createMulta = useCreateMulta();
  const updateMulta = useUpdateMulta();
  const deleteMulta = useDeleteMulta();
  const { confirm, ConfirmDialog } = useConfirm();

  if (!vehiculo) return null;

  const vtvStatus = getVTVStatus(vehiculo.fechaVencimientoVTV);
  const oilStatus = getOilChangeStatus(vehiculo.fechaCambioAceite);
  const licStatus = getLicenseStatus(vehiculo.conductor?.fechaVencimientoRegistro);

  const handleCreateMulta = () => {
    setSelectedMulta(null);
    setMultaDialogOpen(true);
  };

  const handleEditMulta = (multa: MultaVehiculo) => {
    setSelectedMulta(multa);
    setMultaDialogOpen(true);
  };

  const handleDeleteMulta = async (multa: MultaVehiculo) => {
    const ok = await confirm({
      title: 'Eliminar multa',
      message: '¿Está seguro de eliminar esta multa?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMulta.mutateAsync(multa.id);
      toast.success('Multa eliminada');
    } catch {
      toast.error('Error al eliminar multa');
    }
  };

  const handleSaveMulta = async (
    data: MultaVehiculoFormData & {
      estado?: EstadoMultaVehiculo;
      fechaPago?: string | null | undefined;
    }
  ) => {
    if (selectedMulta) {
      await updateMulta.mutateAsync({ multaId: selectedMulta.id, data });
    } else {
      await createMulta.mutateAsync({ ...data, vehiculoId: vehiculo.id });
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="inline-flex items-center px-2 py-0.5 bg-brand text-white font-bold rounded shadow-sm text-xs tracking-wider">
                {vehiculo.patente}
              </div>
              {vehiculo.marca} {vehiculo.modelo}
            </SheetTitle>
            <SheetDescription>
              {vehiculo.tipo || 'Vehículo'} {vehiculo.anio ? `(${vehiculo.anio})` : ''} — #
              {vehiculo.codigoInterno.toString().padStart(4, '0')}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="space-y-6 pt-4">
            {/* Alarmas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Estado y Alertas
              </h4>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${BADGE_CLASSES[vehiculo.estado === 'ACTIVO' ? 'green' : vehiculo.estado === 'TALLER' ? 'amber' : 'red']}`}
                >
                  {vehiculo.estado.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${BADGE_CLASSES[vtvStatus.color]}`}
                >
                  VTV: {vtvStatus.label}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${BADGE_CLASSES[oilStatus.color]}`}
                >
                  Aceite: {oilStatus.label}
                </span>
                {vehiculo.conductor && (
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold border ${BADGE_CLASSES[licStatus.color]}`}
                  >
                    Licencia: {licStatus.label}
                  </span>
                )}
              </div>
            </div>

            {/* Personal Asignado */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Personal Asignado
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500 text-xs">Referente:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-xs">
                    {vehiculo.tecnicoReferente
                      ? `${vehiculo.tecnicoReferente.apellido}, ${vehiculo.tecnicoReferente.nombre}`
                      : 'Sin asignar'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500 text-xs">Técnico:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-xs">
                    {vehiculo.tecnico
                      ? `${vehiculo.tecnico.apellido}, ${vehiculo.tecnico.nombre}`
                      : 'Sin asignar'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500 text-xs">Conductor:</span>
                  <span className="font-medium text-slate-900 dark:text-white text-xs">
                    {vehiculo.conductor
                      ? `${vehiculo.conductor.apellido}, ${vehiculo.conductor.nombre}`
                      : 'Sin asignar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Información
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Zona:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {vehiculo.zona?.nombre || 'Sin zona'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Kms:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {vehiculo.kilometros?.toLocaleString() || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">VTV:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {vehiculo.fechaVencimientoVTV
                      ? new Date(vehiculo.fechaVencimientoVTV).toLocaleDateString('es-AR')
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Cambio aceite:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {vehiculo.fechaCambioAceite
                      ? new Date(vehiculo.fechaCambioAceite).toLocaleDateString('es-AR')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Multas ({multas?.length || 0})
                </h4>
                <button
                  onClick={handleCreateMulta}
                  className="flex items-center gap-1 px-2 py-1 bg-brand hover:bg-brand-dark text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  <Plus className="h-3 w-3" /> Nueva
                </button>
              </div>

              {multasLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-brand animate-spin" />
                </div>
              ) : !multas || multas.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Sin multas registradas</p>
              ) : (
                <div className="space-y-2">
                  {multas.map((multa) => {
                    const tipoConfig = TIPO_MULTA_CONFIG[multa.tipo];
                    const estadoConfig = ESTADO_MULTA_CONFIG[multa.estado];
                    return (
                      <div
                        key={multa.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${BADGE_CLASSES[tipoConfig.color]}`}
                            >
                              {tipoConfig.label}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${BADGE_CLASSES[estadoConfig.color]}`}
                            >
                              {estadoConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditMulta(multa)}
                              className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-brand rounded transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteMulta(multa)}
                              className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {new Date(multa.fecha).toLocaleDateString('es-AR')}
                            {multa.numeroActa && ` — Acta: ${multa.numeroActa}`}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ${multa.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {multa.descripcion && (
                          <p className="text-[10px] text-slate-500">{multa.descripcion}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <MultaDialog
        isOpen={multaDialogOpen}
        onClose={() => setMultaDialogOpen(false)}
        onSave={handleSaveMulta}
        initialData={selectedMulta}
        vehiculoId={vehiculo.id}
      />

      {ConfirmDialog}
    </>
  );
}
