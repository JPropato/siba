import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '../components/ui/Sheet';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { useConfirm } from '../hooks/useConfirm';
import {
  useSegurosAP,
  useResumenSegurosAP,
  useCreateSeguroAP,
  useUpdateSeguroAP,
  useCambiarEstadoSeguroAP,
  useEmpleados,
} from '../hooks/api/useEmpleados';
import { ESTADO_SEGURO_AP_CONFIG, type SeguroAP, type EstadoSeguroAP } from '../types/empleados';

// --- Tab filter ---
type TabFilter = '' | EstadoSeguroAP;

const TABS: { value: TabFilter; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PEDIDO_ALTA', label: 'Pend. Alta' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'PEDIDO_BAJA', label: 'Pend. Baja' },
  { value: 'BAJA', label: 'Bajas' },
];

// --- Badge color classes ---
const BADGE_CLASSES: Record<string, string> = {
  green:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  amber:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};

// --- Transition actions ---
const TRANSITION_ACTIONS: Record<
  string,
  { label: string; next: EstadoSeguroAP; needsDate: boolean; dateLabel: string }
> = {
  PEDIDO_ALTA: {
    label: 'Confirmar Alta',
    next: 'ACTIVO',
    needsDate: true,
    dateLabel: 'Fecha alta efectiva',
  },
  ACTIVO: {
    label: 'Solicitar Baja',
    next: 'PEDIDO_BAJA',
    needsDate: false,
    dateLabel: '',
  },
  PEDIDO_BAJA: {
    label: 'Confirmar Baja',
    next: 'BAJA',
    needsDate: true,
    dateLabel: 'Fecha baja efectiva',
  },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SegurosAPPage() {
  const [tabFilter, setTabFilter] = useState<TabFilter>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSeguro, setEditingSeguro] = useState<SeguroAP | null>(null);

  // Transition dialog
  const [transitionSeguro, setTransitionSeguro] = useState<SeguroAP | null>(null);
  const [transitionDate, setTransitionDate] = useState('');

  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('empleados:escribir');
  const { ConfirmDialog } = useConfirm();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [tabFilter, debouncedSearch]);

  // Data
  const { data: resumen, isLoading: loadingResumen } = useResumenSegurosAP();
  const {
    data: segurosData,
    isLoading: loadingSeguros,
    refetch,
  } = useSegurosAP({ estado: tabFilter || undefined, search: debouncedSearch || undefined }, page);
  const seguros = segurosData?.data ?? [];
  const totalPages = segurosData?.totalPages ?? 1;

  // Mutations
  const createSeguro = useCreateSeguroAP();
  const updateSeguro = useUpdateSeguroAP();
  const cambiarEstado = useCambiarEstadoSeguroAP();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // --- Create drawer ---
  const handleOpenCreate = () => {
    setEditingSeguro(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (seguro: SeguroAP) => {
    setEditingSeguro(seguro);
    setDrawerOpen(true);
  };

  // --- Transition ---
  const handleOpenTransition = (seguro: SeguroAP) => {
    setTransitionSeguro(seguro);
    setTransitionDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmTransition = async () => {
    if (!transitionSeguro) return;
    const action = TRANSITION_ACTIONS[transitionSeguro.estado];
    if (!action) return;

    try {
      await cambiarEstado.mutateAsync({
        seguroId: transitionSeguro.id,
        nuevoEstado: action.next,
        fechaEfectiva: action.needsDate ? transitionDate : undefined,
      });
      toast.success(`Estado cambiado a ${ESTADO_SEGURO_AP_CONFIG[action.next].label}`);
      setTransitionSeguro(null);
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<ShieldCheck className="h-5 w-5" />}
          breadcrumb={['RRHH', 'Seguros AP']}
          title="Seguros AP"
          subtitle="Gestión de seguros de accidentes personales"
          action={
            canWrite ? (
              <button
                onClick={handleOpenCreate}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            ) : undefined
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            title="Con cobertura"
            value={loadingResumen ? '...' : (resumen?.activos ?? 0)}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Pend. alta"
            value={loadingResumen ? '...' : (resumen?.pendientesAlta ?? 0)}
            icon={Clock}
            color="indigo"
          />
          <StatCard
            title="Pend. baja"
            value={loadingResumen ? '...' : (resumen?.pendientesBaja ?? 0)}
            icon={AlertTriangle}
            color="orange"
          />
          <StatCard
            title="Sin cobertura"
            value={loadingResumen ? '...' : (resumen?.sinCobertura ?? 0)}
            icon={XCircle}
            color="gold"
            description={
              resumen && resumen.sinCobertura > 0
                ? `de ${resumen.totalEmpleadosActivos} activos`
                : undefined
            }
          />
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTabFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  tabFilter === tab.value
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        {loadingSeguros ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : seguros.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-10 w-10" />}
            title="Sin registros"
            description={
              tabFilter
                ? `No hay seguros AP con estado "${ESTADO_SEGURO_AP_CONFIG[tabFilter as EstadoSeguroAP]?.label}"`
                : 'No hay seguros AP registrados'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">
                    Destino
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">
                    Vigencia
                  </th>
                  {canWrite && (
                    <th className="text-right px-4 py-3 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {seguros.map((seguro) => {
                  const estadoConfig = ESTADO_SEGURO_AP_CONFIG[seguro.estado];
                  const badgeClass = BADGE_CLASSES[estadoConfig.color] || BADGE_CLASSES.blue;
                  const action = TRANSITION_ACTIONS[seguro.estado];

                  return (
                    <tr
                      key={seguro.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Empleado */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {seguro.empleado
                              ? `${seguro.empleado.apellido}, ${seguro.empleado.nombre}`
                              : `Empleado #${seguro.empleadoId}`}
                          </span>
                          {seguro.empleado?.legajo && (
                            <span className="text-xs text-slate-400">
                              Legajo: {seguro.empleado.legajo}
                            </span>
                          )}
                          {seguro.empleado?.cuil && (
                            <span className="text-xs text-slate-400">
                              CUIL: {seguro.empleado.cuil}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
                        >
                          {estadoConfig.label}
                        </span>
                      </td>

                      {/* Destino */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {seguro.destino || '-'}
                      </td>

                      {/* Vigencia */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span>{formatDate(seguro.fechaInicio)}</span>
                          {seguro.fechaFinalizacion && (
                            <span>al {formatDate(seguro.fechaFinalizacion)}</span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {action && seguro.estado !== 'BAJA' && (
                              <button
                                onClick={() => handleOpenTransition(seguro)}
                                className="px-2 py-1 text-[11px] font-bold rounded-md bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                              >
                                {action.label}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(seguro)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Editar"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Create/Edit Drawer */}
        <SeguroAPDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          seguro={editingSeguro}
          onCreate={createSeguro.mutateAsync}
          onUpdate={updateSeguro.mutateAsync}
        />

        {/* Transition Dialog */}
        {transitionSeguro && TRANSITION_ACTIONS[transitionSeguro.estado] && (
          <TransitionDialog
            seguro={transitionSeguro}
            action={TRANSITION_ACTIONS[transitionSeguro.estado]}
            date={transitionDate}
            onDateChange={setTransitionDate}
            onConfirm={handleConfirmTransition}
            onCancel={() => setTransitionSeguro(null)}
            isLoading={cambiarEstado.isPending}
          />
        )}

        {ConfirmDialog}

        {/* FAB mobile */}
        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="sm:hidden fixed bottom-6 right-6 z-40 p-4 bg-brand hover:bg-brand-dark text-white rounded-full shadow-lg transition-all active:scale-95"
            aria-label="Nuevo Seguro AP"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </PullToRefresh>
  );
}

// ===== Drawer: Create / Edit =====

interface SeguroAPDrawerProps {
  open: boolean;
  onClose: () => void;
  seguro: SeguroAP | null;
  onCreate: (data: {
    empleadoId: number;
    destino?: string | null;
    observaciones?: string | null;
    fechaInicio?: string | null;
    fechaFinalizacion?: string | null;
  }) => Promise<unknown>;
  onUpdate: (data: {
    seguroId: number;
    data: {
      destino?: string | null;
      observaciones?: string | null;
      fechaInicio?: string | null;
      fechaFinalizacion?: string | null;
    };
  }) => Promise<unknown>;
}

function SeguroAPDrawer({ open, onClose, seguro, onCreate, onUpdate }: SeguroAPDrawerProps) {
  const [empleadoSearch, setEmpleadoSearch] = useState('');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null);
  const [destino, setDestino] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinalizacion, setFechaFinalizacion] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!seguro;

  // Load empleados for selector (only when creating)
  const { data: empleadosData } = useEmpleados({ search: empleadoSearch, estado: 'ACTIVO' }, 1, 20);
  const empleados = empleadosData?.data ?? [];

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      if (seguro) {
        setDestino(seguro.destino || '');
        setObservaciones(seguro.observaciones || '');
        setFechaInicio(seguro.fechaInicio ? seguro.fechaInicio.split('T')[0] : '');
        setFechaFinalizacion(
          seguro.fechaFinalizacion ? seguro.fechaFinalizacion.split('T')[0] : ''
        );
        setSelectedEmpleadoId(seguro.empleadoId);
      } else {
        setDestino('');
        setObservaciones('');
        setFechaInicio('');
        setFechaFinalizacion('');
        setSelectedEmpleadoId(null);
        setEmpleadoSearch('');
      }
    }
  }, [open, seguro]);

  const handleSubmit = async () => {
    if (!isEditing && !selectedEmpleadoId) {
      toast.error('Seleccione un empleado');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await onUpdate({
          seguroId: seguro!.id,
          data: {
            destino: destino || null,
            observaciones: observaciones || null,
            fechaInicio: fechaInicio || null,
            fechaFinalizacion: fechaFinalizacion || null,
          },
        });
        toast.success('Seguro AP actualizado');
      } else {
        await onCreate({
          empleadoId: selectedEmpleadoId!,
          destino: destino || null,
          observaciones: observaciones || null,
          fechaInicio: fechaInicio || null,
          fechaFinalizacion: fechaFinalizacion || null,
        });
        toast.success('Seguro AP creado');
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    'w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent width="md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Seguro AP' : 'Nuevo Seguro AP'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? `Seguro #${seguro!.id} - ${seguro!.empleado?.apellido}, ${seguro!.empleado?.nombre}`
              : 'Solicitar alta de seguro de accidentes personales'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-5">
            {/* Empleado selector (solo al crear) */}
            {!isEditing && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Empleado *
                </label>
                {selectedEmpleadoId ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                      {empleados.find((e) => e.id === selectedEmpleadoId)
                        ? `${empleados.find((e) => e.id === selectedEmpleadoId)!.apellido}, ${empleados.find((e) => e.id === selectedEmpleadoId)!.nombre}`
                        : `Empleado #${selectedEmpleadoId}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmpleadoId(null)}
                      className="text-xs text-green-600 hover:text-green-800 font-bold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar empleado activo..."
                        value={empleadoSearch}
                        onChange={(e) => setEmpleadoSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    {empleadoSearch && (
                      <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                        {empleados.length === 0 ? (
                          <p className="p-3 text-xs text-slate-400 text-center">Sin resultados</p>
                        ) : (
                          empleados.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setSelectedEmpleadoId(emp.id);
                                setEmpleadoSearch('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {emp.apellido}, {emp.nombre}
                              </span>
                              <span className="text-xs text-slate-400 ml-2">
                                {emp.legajo ? `Leg. ${emp.legajo}` : ''}
                                {emp.cuil ? ` - ${emp.cuil}` : ''}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Estado (solo lectura al editar) */}
            {isEditing && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Estado actual
                </label>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${BADGE_CLASSES[ESTADO_SEGURO_AP_CONFIG[seguro!.estado].color]}`}
                  >
                    {ESTADO_SEGURO_AP_CONFIG[seguro!.estado].label}
                  </span>
                </div>
              </div>
            )}

            {/* Destino */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Destino / Ubicación
              </label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej: Obra X, Sucursal Y"
                className={inputClasses}
              />
            </div>

            {/* Fechas de vigencia */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Fecha finalización
                </label>
                <input
                  type="date"
                  value={fechaFinalizacion}
                  onChange={(e) => setFechaFinalizacion(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Historial de fechas (solo al editar) */}
            {isEditing && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Historial
                </label>
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Solicitud alta:</span>
                    <span className="font-medium">{formatDate(seguro!.fechaSolicitudAlta)}</span>
                  </div>
                  {seguro!.fechaAltaEfectiva && (
                    <div className="flex justify-between">
                      <span>Alta efectiva:</span>
                      <span className="font-medium text-green-600">
                        {formatDate(seguro!.fechaAltaEfectiva)}
                      </span>
                    </div>
                  )}
                  {seguro!.fechaSolicitudBaja && (
                    <div className="flex justify-between">
                      <span>Solicitud baja:</span>
                      <span className="font-medium text-amber-600">
                        {formatDate(seguro!.fechaSolicitudBaja)}
                      </span>
                    </div>
                  )}
                  {seguro!.fechaBajaEfectiva && (
                    <div className="flex justify-between">
                      <span>Baja efectiva:</span>
                      <span className="font-medium text-red-600">
                        {formatDate(seguro!.fechaBajaEfectiva)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetBody>

        <SheetFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || (!isEditing && !selectedEmpleadoId)}
            className="px-4 py-2 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar' : 'Solicitar Alta'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ===== Transition Dialog =====

interface TransitionDialogProps {
  seguro: SeguroAP;
  action: { label: string; next: EstadoSeguroAP; needsDate: boolean; dateLabel: string };
  date: string;
  onDateChange: (d: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function TransitionDialog({
  seguro,
  action,
  date,
  onDateChange,
  onConfirm,
  onCancel,
  isLoading,
}: TransitionDialogProps) {
  const empleadoName = seguro.empleado
    ? `${seguro.empleado.apellido}, ${seguro.empleado.nombre}`
    : `Empleado #${seguro.empleadoId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{action.label}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{empleadoName}</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full font-bold border ${BADGE_CLASSES[ESTADO_SEGURO_AP_CONFIG[seguro.estado].color]}`}
            >
              {ESTADO_SEGURO_AP_CONFIG[seguro.estado].label}
            </span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span
              className={`px-2 py-0.5 rounded-full font-bold border ${BADGE_CLASSES[ESTADO_SEGURO_AP_CONFIG[action.next].color]}`}
            >
              {ESTADO_SEGURO_AP_CONFIG[action.next].label}
            </span>
          </div>

          {action.needsDate && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {action.dateLabel}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || (action.needsDate && !date)}
            className="px-4 py-2 text-sm font-bold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
