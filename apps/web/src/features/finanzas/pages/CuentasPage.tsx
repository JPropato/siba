import { useState, useEffect } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaFinanciera } from '../types';
import {
  Building2,
  Plus,
  CreditCard,
  Wallet,
  Smartphone,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  Pencil,
  Power,
} from 'lucide-react';
import { TIPO_CUENTA_CONFIG } from '../types';
import CuentaDrawer from '../components/CuentaDrawer';

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSaldo, setTotalSaldo] = useState(0);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaFinanciera | null>(null);

  // Menu state
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    loadCuentas();
  }, []);

  const loadCuentas = async () => {
    try {
      setIsLoading(true);
      const res = await finanzasApi.getCuentas();
      setCuentas(res);
      const total = res.reduce((acc, c) => acc + Number(c.saldoActual), 0);
      setTotalSaldo(total);
    } catch (error) {
      console.error('Error loading cuentas:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-7 w-7 text-gold" />
              Cuentas y Bancos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Gestión de disponibilidades y saldos bancarios
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCuenta(null);
              setIsDrawerOpen(true);
            }}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            NUEVA CUENTA
          </button>
        </div>

        {/* Resume Card */}
        <div className="bg-brand text-white p-6 rounded-2xl shadow-xl shadow-brand/20 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="h-32 w-32" />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <p className="text-brand-light text-xs font-bold uppercase tracking-widest mb-1">
              Saldo Total Disponible
            </p>
            <h2 className="text-4xl font-extrabold tabular-nums">{formatCurrency(totalSaldo)}</h2>
          </div>
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-light mb-1">
                Cuentas Activas
              </p>
              <p className="text-xl font-bold">{cuentas.length}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-light mb-1">
                Moneda Principal
              </p>
              <p className="text-xl font-bold">ARS</p>
            </div>
          </div>
        </div>

        {/* Cuentas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800"
                ></div>
              ))
            : cuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`p-3 rounded-xl ${cuenta.tipo === 'INVERSION' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'} dark:bg-slate-800 dark:text-slate-400 group-hover:scale-110 transition-transform`}
                      >
                        {getIconForType(cuenta.tipo)}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === cuenta.id ? null : cuenta.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {menuOpenId === cuenta.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  setSelectedCuenta(cuenta);
                                  setIsDrawerOpen(true);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                }}
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

                    <div className="mt-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Saldo Actual
                      </p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(cuenta.saldoActual)}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between group-hover:bg-slate-100/80 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        CBU / ALIAS
                      </span>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                        {cuenta.alias || cuenta.cbu || 'No disponible'}
                      </span>
                    </div>
                    <button className="flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-1 transition-transform">
                      Movimientos
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

          {/* Add Card */}
          {!isLoading && (
            <button
              onClick={() => {
                setSelectedCuenta(null);
                setIsDrawerOpen(true);
              }}
              className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-brand hover:border-brand/40 transition-all hover:bg-white dark:hover:bg-slate-900 h-full min-h-[220px]"
            >
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold">Agregar nueva cuenta</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawer */}
      <CuentaDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCuenta(null);
        }}
        cuenta={selectedCuenta}
        onSuccess={() => {
          loadCuentas();
          setIsDrawerOpen(false);
          setSelectedCuenta(null);
        }}
      />
    </>
  );
}
