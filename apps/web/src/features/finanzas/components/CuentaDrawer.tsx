import { useState, useEffect } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type { CuentaFinanciera, TipoCuenta, Banco } from '../types';
import { TIPO_CUENTA_CONFIG } from '../types';
import {
  X,
  Building2,
  Save,
  Wallet,
  CreditCard,
  Smartphone,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';

interface CuentaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cuenta: CuentaFinanciera | null;
  onSuccess: () => void;
}

const TIPOS_CUENTA: TipoCuenta[] = [
  'CAJA_CHICA',
  'CUENTA_CORRIENTE',
  'CAJA_AHORRO',
  'BILLETERA_VIRTUAL',
  'INVERSION',
];

const TIPOS_INVERSION = [
  { value: 'PLAZO_FIJO', label: 'Plazo Fijo' },
  { value: 'FCI', label: 'Fondo Común de Inversión' },
  { value: 'CAUCIONES', label: 'Cauciones' },
  { value: 'OTRO', label: 'Otro' },
];

const getIconForType = (type: TipoCuenta) => {
  switch (type) {
    case 'CAJA_CHICA':
      return <Wallet className="h-5 w-5" />;
    case 'CUENTA_CORRIENTE':
      return <Building2 className="h-5 w-5" />;
    case 'CAJA_AHORRO':
      return <PiggyBank className="h-5 w-5" />;
    case 'BILLETERA_VIRTUAL':
      return <Smartphone className="h-5 w-5" />;
    case 'INVERSION':
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export default function CuentaDrawer({ isOpen, onClose, cuenta, onSuccess }: CuentaDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bancos, setBancos] = useState<Banco[]>([]);

  // Form state
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoCuenta>('CUENTA_CORRIENTE');
  const [bancoId, setBancoId] = useState<number | ''>('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [moneda, setMoneda] = useState('ARS');
  // Inversiones
  const [tipoInversion, setTipoInversion] = useState('');
  const [tasaAnual, setTasaAnual] = useState<number | ''>('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const isEditing = !!cuenta;
  const showBancoField = tipo !== 'CAJA_CHICA';
  const showInversionFields = tipo === 'INVERSION';

  // Load bancos on mount
  useEffect(() => {
    const fetchBancos = async () => {
      try {
        const data = await finanzasApi.getBancos();
        setBancos(data);
      } catch (error) {
        console.error('Error fetching bancos:', error);
      }
    };
    fetchBancos();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (cuenta) {
      setNombre(cuenta.nombre);
      setTipo(cuenta.tipo);
      setBancoId(cuenta.bancoId || '');
      setNumeroCuenta(cuenta.numeroCuenta || '');
      setCbu(cuenta.cbu || '');
      setAlias(cuenta.alias || '');
      setSaldoInicial(cuenta.saldoInicial);
      setMoneda(cuenta.moneda);
      setTipoInversion(cuenta.tipoInversion || '');
      setTasaAnual(cuenta.tasaAnual || '');
      setFechaVencimiento(cuenta.fechaVencimiento?.split('T')[0] || '');
    } else {
      resetForm();
    }
  }, [cuenta]);

  const resetForm = () => {
    setNombre('');
    setTipo('CUENTA_CORRIENTE');
    setBancoId('');
    setNumeroCuenta('');
    setCbu('');
    setAlias('');
    setSaldoInicial(0);
    setMoneda('ARS');
    setTipoInversion('');
    setTasaAnual('');
    setFechaVencimiento('');
  };

  const handleSave = async () => {
    if (!nombre) {
      alert('Ingrese un nombre para la cuenta');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        nombre,
        tipo,
        bancoId: bancoId || null,
        numeroCuenta: numeroCuenta || null,
        cbu: cbu || null,
        alias: alias || null,
        saldoInicial,
        moneda,
        tipoInversion: showInversionFields ? tipoInversion || null : null,
        tasaAnual: showInversionFields && tasaAnual ? Number(tasaAnual) : null,
        fechaVencimiento:
          showInversionFields && fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
      };

      if (isEditing && cuenta) {
        await finanzasApi.updateCuenta(cuenta.id, data);
      } else {
        await finanzasApi.createCuenta(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving cuenta:', error);
      alert('Error al guardar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md z-50 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand/10 text-brand">{getIconForType(tipo)}</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h2>
                <p className="text-xs text-slate-500">{TIPO_CUENTA_CONFIG[tipo]?.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-5">
            {/* Tipo de Cuenta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Cuenta *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_CUENTA.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      tipo === t
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {getIconForType(t)}
                    {TIPO_CUENTA_CONFIG[t]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Cuenta *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Caja Chica Oficina, Banco Nación CC"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
              />
            </div>

            {/* Banco (solo si no es Caja Chica) */}
            {showBancoField && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Banco / Entidad
                </label>
                <select
                  value={bancoId}
                  onChange={(e) => setBancoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                >
                  <option value="">Seleccionar banco...</option>
                  {bancos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombreCorto}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CBU y Alias */}
            {showBancoField && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CBU
                  </label>
                  <input
                    type="text"
                    value={cbu}
                    onChange={(e) => setCbu(e.target.value)}
                    placeholder="22 dígitos"
                    maxLength={22}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alias
                  </label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="mi.alias.cbu"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {/* Número de Cuenta */}
            {showBancoField && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Número de cuenta bancaria"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                />
              </div>
            )}

            {/* Saldo Inicial y Moneda */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(Number(e.target.value))}
                    disabled={isEditing}
                    className="w-full h-10 pl-7 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-slate-400 mt-1">
                    El saldo inicial no se puede modificar
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                >
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar</option>
                </select>
              </div>
            </div>

            {/* Campos de Inversión */}
            {showInversionFields && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Datos de Inversión
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Inversión
                  </label>
                  <select
                    value={tipoInversion}
                    onChange={(e) => setTipoInversion(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_INVERSION.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tasa Anual (%)
                    </label>
                    <input
                      type="number"
                      value={tasaAnual}
                      onChange={(e) => setTasaAnual(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej: 45"
                      step="0.01"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Vencimiento
                    </label>
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
