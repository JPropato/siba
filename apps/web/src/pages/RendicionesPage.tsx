import { useState, useCallback, useRef } from 'react';
import {
  Receipt,
  Plus,
  CreditCard,
  Calendar,
  DollarSign,
  Flame,
  Wrench,
  Droplets,
  Fuel,
  Cog,
  Zap,
  UtensilsCrossed,
  Hammer,
  MoreHorizontal,
  History,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { StatCard } from '../components/dashboard/StatCard';
import { ActionTile } from '../components/tiles/ActionTile';
import { TileGrid } from '../components/tiles/TileGrid';
import { TileSection } from '../components/tiles/TileSection';
import { toast } from 'sonner';
import {
  useTarjetas,
  useGastos,
  GastoDialog,
  type TarjetaPrecargable,
  type GastoFormData,
  useCreateGasto,
  type CategoriaGastoTarjeta,
} from '../features/tarjetas';

export default function RendicionesPage() {
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaPrecargable | null>(null);
  const [isGastoDialogOpen, setIsGastoDialogOpen] = useState(false);
  const [mesActual] = useState(new Date().getMonth() + 1);
  const [anioActual] = useState(new Date().getFullYear());

  // Refs for scrolling
  const tarjetasRef = useRef<HTMLDivElement>(null);
  const gastosRef = useRef<HTMLDivElement>(null);

  // Fetch user's cards
  const {
    data: tarjetasData,
    isLoading: loadingTarjetas,
    refetch: refetchTarjetas,
  } = useTarjetas({});
  const tarjetas = tarjetasData?.data ?? [];

  // Fetch gastos for selected card
  const { data: gastosData, refetch: refetchGastos } = useGastos(selectedTarjeta?.id ?? null, {
    limit: 20,
  });
  const gastos = gastosData?.data ?? [];

  const createGasto = useCreateGasto();

  const handleRefresh = useCallback(async () => {
    await refetchTarjetas();
    if (selectedTarjeta) {
      await refetchGastos();
    }
  }, [refetchTarjetas, refetchGastos, selectedTarjeta]);

  const handleNuevoGasto = () => {
    if (!selectedTarjeta) {
      toast.error('Seleccione una tarjeta primero');
      // Scroll to tarjetas section
      tarjetasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setIsGastoDialogOpen(true);
  };

  const handleVerTarjetas = () => {
    tarjetasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVerHistorial = () => {
    if (!selectedTarjeta) {
      toast.info('Seleccione una tarjeta primero');
      tarjetasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    gastosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveGasto = async (data: GastoFormData) => {
    if (!selectedTarjeta) return;

    try {
      await createGasto.mutateAsync({ tarjetaId: selectedTarjeta.id, data });
      toast.success('Gasto registrado exitosamente');
      setIsGastoDialogOpen(false);
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al registrar gasto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format relative time (simple version without date-fns)
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 30) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-AR');
  };

  // Define categoria config with icons and colors
  const CATEGORIA_GASTO_CONFIG: Record<
    CategoriaGastoTarjeta,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      bgColor: string;
      color: string;
    }
  > = {
    GAS: { label: 'Gas', icon: Flame, bgColor: 'bg-orange-100', color: 'text-orange-600' },
    FERRETERIA: {
      label: 'Ferretería',
      icon: Wrench,
      bgColor: 'bg-blue-100',
      color: 'text-blue-600',
    },
    ESTACIONAMIENTO: {
      label: 'Estacionamiento',
      icon: CreditCard,
      bgColor: 'bg-purple-100',
      color: 'text-purple-600',
    },
    LAVADERO: { label: 'Lavadero', icon: Droplets, bgColor: 'bg-cyan-100', color: 'text-cyan-600' },
    NAFTA: { label: 'Nafta', icon: Fuel, bgColor: 'bg-red-100', color: 'text-red-600' },
    REPUESTOS: { label: 'Repuestos', icon: Cog, bgColor: 'bg-gray-100', color: 'text-gray-600' },
    MATERIALES_ELECTRICOS: {
      label: 'Materiales Eléctricos',
      icon: Zap,
      bgColor: 'bg-yellow-100',
      color: 'text-yellow-600',
    },
    PEAJES: { label: 'Peajes', icon: Calendar, bgColor: 'bg-indigo-100', color: 'text-indigo-600' },
    COMIDA: {
      label: 'Comida',
      icon: UtensilsCrossed,
      bgColor: 'bg-green-100',
      color: 'text-green-600',
    },
    HERRAMIENTAS: {
      label: 'Herramientas',
      icon: Hammer,
      bgColor: 'bg-amber-100',
      color: 'text-amber-600',
    },
    OTRO: { label: 'Otro', icon: MoreHorizontal, bgColor: 'bg-slate-100', color: 'text-slate-600' },
  };

  const totalGastosMes = gastos
    .filter((g) => {
      const fecha = new Date(g.fecha);
      return fecha.getMonth() + 1 === mesActual && fecha.getFullYear() === anioActual;
    })
    .reduce((sum, g) => sum + Number(g.monto), 0);

  const saldoTarjeta = selectedTarjeta?.cuentaFinanciera?.saldoActual ?? 0;

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Receipt className="h-5 w-5" />}
          breadcrumb={['Tesorería', 'Rendiciones']}
          title="Mis Gastos"
          subtitle="Registre sus gastos con tarjeta de forma rápida y sencilla"
        />

        {/* ACTION TILES - PRIMERA PANTALLA (PROMINENTE) */}
        <TileSection title="Acciones Rápidas">
          <TileGrid columns={4}>
            <ActionTile
              icon={<Plus className="h-6 w-6" />}
              title="Nuevo Gasto"
              description="Registrar un gasto con tarjeta"
              onClick={handleNuevoGasto}
              variant="action"
            />
            <ActionTile
              icon={<CreditCard className="h-6 w-6" />}
              title="Mis Tarjetas"
              description="Ver y seleccionar tarjetas"
              onClick={handleVerTarjetas}
              variant="query"
              badge={tarjetas.length > 0 ? tarjetas.length : undefined}
            />
            <ActionTile
              icon={<History className="h-6 w-6" />}
              title="Historial"
              description="Ver todos mis gastos"
              onClick={handleVerHistorial}
              variant="query"
              badge={gastos.length > 0 ? gastos.length : undefined}
            />
            <ActionTile
              icon={<FileText className="h-6 w-6" />}
              title="Nueva Rendición"
              description="Crear rendición de gastos"
              onClick={() => toast.info('Funcionalidad próximamente')}
              variant="report"
              disabled
            />
          </TileGrid>
        </TileSection>

        {/* Stats - SECUNDARIOS (solo si hay tarjeta seleccionada) */}
        {selectedTarjeta && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resumen - {selectedTarjeta.alias || 'Tarjeta Seleccionada'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                title="Saldo Disponible"
                value={formatCurrency(saldoTarjeta)}
                icon={DollarSign}
                color={saldoTarjeta >= 0 ? 'emerald' : 'orange'}
              />
              <StatCard
                title="Gastos Este Mes"
                value={formatCurrency(totalGastosMes)}
                icon={Receipt}
                color="brand"
              />
              <StatCard title="Total Gastos" value={gastos.length} icon={Calendar} color="indigo" />
            </div>
          </div>
        )}

        {/* Card Selection */}
        <div ref={tarjetasRef} className="space-y-3 scroll-mt-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Mis Tarjetas</h2>
          {loadingTarjetas ? (
            <div className="text-center py-8 text-sm text-slate-500">Cargando tarjetas...</div>
          ) : tarjetas.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No tiene tarjetas asignadas
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tarjetas.map((tarjeta) => (
                <button
                  key={tarjeta.id}
                  onClick={() => setSelectedTarjeta(tarjeta)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTarjeta?.id === tarjeta.id
                      ? 'border-brand bg-brand/5 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {tarjeta.alias || 'Sin alias'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tarjeta.tipo === 'PRECARGABLE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
                    >
                      {tarjeta.tipo === 'PRECARGABLE' ? 'Precargable' : 'Corporativa'}
                    </span>
                  </div>
                  {tarjeta.numeroTarjeta && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      •••• {tarjeta.numeroTarjeta.slice(-4)}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Saldo:</span>
                    <span
                      className={`text-sm font-bold ${
                        (tarjeta.cuentaFinanciera?.saldoActual ?? 0) >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(tarjeta.cuentaFinanciera?.saldoActual ?? 0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        {selectedTarjeta && (
          <div ref={gastosRef} className="space-y-3 scroll-mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gastos Recientes</h2>
              <button
                onClick={handleNuevoGasto}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg transition-all sm:hidden"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo
              </button>
            </div>

            {gastos.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm text-slate-500 mb-4">No hay gastos registrados</p>
                <button
                  onClick={handleNuevoGasto}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Primer Gasto
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {gastos.map((gasto) => {
                  const categoriaConfig = CATEGORIA_GASTO_CONFIG[gasto.categoria];
                  return (
                    <div
                      key={gasto.id}
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${categoriaConfig.bgColor}`}>
                            <categoriaConfig.icon className={`h-4 w-4 ${categoriaConfig.color}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              {gasto.concepto}
                            </div>
                            <div className="text-xs text-slate-500">
                              {categoriaConfig.label}
                              {gasto.ticket && (
                                <span className="ml-2">· Ticket #{gasto.ticket.codigoInterno}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(Number(gasto.monto))}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatRelativeTime(gasto.fecha)}
                          </div>
                        </div>
                      </div>

                      {/* Additional info */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {gasto.centroCosto && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {gasto.centroCosto.nombre}
                          </span>
                        )}
                        {gasto.movimiento?.cuentaContable && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {gasto.movimiento.cuentaContable.codigo} -{' '}
                            {gasto.movimiento.cuentaContable.nombre}
                          </span>
                        )}
                        {gasto.archivos && gasto.archivos.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {gasto.archivos.length} comprobante(s)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <GastoDialog
          isOpen={isGastoDialogOpen}
          onClose={() => setIsGastoDialogOpen(false)}
          onSave={handleSaveGasto}
          tarjetaId={selectedTarjeta?.id ?? 0}
        />
      </div>
    </PullToRefresh>
  );
}
