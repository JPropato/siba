import { useState, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  CreditCard,
  Wallet,
  Smartphone,
  TrendingUp,
  Pencil,
  Power,
  Landmark,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { FloatingActionButton } from '../../../components/layout/FloatingActionButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useConfirm } from '../../../hooks/useConfirm';
import { TIPO_CUENTA_CONFIG } from '../types';
import type { CuentaFinanciera } from '../types';
import { useCuentas, useDeleteCuenta } from '../hooks/useCuentas';

const CuentaDrawer = lazy(() => import('../components/CuentaDrawer'));

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'CAJA_CHICA':
      return <Wallet className="h-5 w-5" />;
    case 'CUENTA_CORRIENTE':
      return <Building2 className="h-5 w-5" />;
    case 'CAJA_AHORRO':
      return <CreditCard className="h-5 w-5" />;
    case 'BILLETERA_VIRTUAL':
      return <Smartphone className="h-5 w-5" />;
    case 'INVERSION':
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export default function CuentasPage() {
  const { data: cuentas = [], isLoading, refetch } = useCuentas();
  const deleteCuenta = useDeleteCuenta();
  const { confirm, ConfirmDialog } = useConfirm();
  const navigate = useNavigate();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaFinanciera | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const totalSaldo = cuentas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCreate = () => {
    setSelectedCuenta(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (cuenta: CuentaFinanciera) => {
    setSelectedCuenta(cuenta);
    setIsDrawerOpen(true);
    setMenuOpenId(null);
  };

  const handleDeactivate = async (cuenta: CuentaFinanciera) => {
    setMenuOpenId(null);
    const ok = await confirm({
      title: 'Desactivar cuenta',
      message: `¿Está seguro de desactivar "${cuenta.nombre}"? Los movimientos asociados se mantendrán.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteCuenta.mutateAsync(cuenta.id);
      toast.success('Cuenta desactivada');
    } catch {
      toast.error('Error al desactivar cuenta');
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Landmark className="h-5 w-5" />}
          breadcrumb={['Finanzas', 'Cuentas']}
          title="Cuentas y Bancos"
          subtitle="Gestión de disponibilidades y saldos bancarios"
          count={cuentas.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </button>
          }
        />

        {/* Resume Card */}
        <div className="bg-brand text-white p-5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="h-32 w-32" />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <p className="text-brand-light text-[10px] font-bold uppercase tracking-widest mb-1">
              Saldo Total Disponible
            </p>
            <h2 className="text-3xl font-extrabold tabular-nums">{formatCurrency(totalSaldo)}</h2>
          </div>
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-light mb-1">
                Cuentas Activas
              </p>
              <p className="text-xl font-bold">{cuentas.length}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-light mb-1">
                Moneda Principal
              </p>
              <p className="text-xl font-bold">ARS</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cuentas.length === 0 && (
          <EmptyState
            icon={<Landmark className="h-6 w-6 text-brand" />}
            title="Sin cuentas"
            description="No hay cuentas registradas. Creá tu primera cuenta para comenzar."
            primaryAction={{
              label: 'Crear Cuenta',
              onClick: handleCreate,
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        )}

        {/* Cuentas Grid */}
        {!isLoading && cuentas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col"
              >
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-3 rounded-lg ${cuenta.tipo === 'INVERSION' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'} dark:bg-slate-800 dark:text-slate-400 group-hover:scale-110 transition-transform`}
                    >
                      {getIconForType(cuenta.tipo)}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === cuenta.id ? null : cuenta.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {menuOpenId === cuenta.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                            <button
                              onClick={() => handleEdit(cuenta)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeactivate(cuenta)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-red-600"
                            >
                              <Power className="h-4 w-4" />
                              Desactivar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      {cuenta.nombre}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {cuenta.banco?.nombreCorto || TIPO_CUENTA_CONFIG[cuenta.tipo]?.label}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Saldo Actual
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(cuenta.saldoActual)}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between group-hover:bg-slate-100/80 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                      CBU / ALIAS
                    </span>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                      {cuenta.alias || cuenta.cbu || 'No disponible'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/finanzas/movimientos')}
                    className="flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-1 transition-transform"
                  >
                    Movimientos
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Card */}
            <button
              onClick={handleCreate}
              className="bg-slate-50 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-brand hover:border-brand/40 transition-all hover:bg-white dark:hover:bg-slate-900 h-full min-h-[220px]"
            >
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold">Agregar nueva cuenta</span>
            </button>
          </div>
        )}

        {/* Drawer - Lazy loaded */}
        {isDrawerOpen && (
          <Suspense fallback={null}>
            <CuentaDrawer
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedCuenta(null);
              }}
              cuenta={selectedCuenta}
              onSuccess={() => {
                setIsDrawerOpen(false);
                setSelectedCuenta(null);
              }}
            />
          </Suspense>
        )}

        {ConfirmDialog}

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nueva Cuenta"
        />
      </div>
    </PullToRefresh>
  );
}
