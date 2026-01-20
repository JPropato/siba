import { useState, useEffect } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type {
  CuentaFinanciera,
  TipoMovimiento,
  MedioPago,
  CategoriaIngreso,
  CategoriaEgreso,
} from '../types';
import { CATEGORIA_INGRESO_LABELS, CATEGORIA_EGRESO_LABELS, MEDIO_PAGO_LABELS } from '../types';
import {
  X,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Building2,
  Ticket,
  Wrench,
  User,
} from 'lucide-react';
import api from '@/lib/api';

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

export default function MovimientoDrawer({ isOpen, onClose, onSuccess }: MovimientoDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Lookups
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [obras, setObras] = useState<ObraOption[]>([]);
  const [tickets, setTickets] = useState<TicketOption[]>([]);

  // Form state
  const [tipo, setTipo] = useState<TipoMovimiento>('INGRESO');
  const [cuentaId, setCuentaId] = useState<number | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [fechaMovimiento, setFechaMovimiento] = useState(new Date().toISOString().split('T')[0]);
  const [medioPago, setMedioPago] = useState<MedioPago>('TRANSFERENCIA');
  const [categoriaIngreso, setCategoriaIngreso] = useState<CategoriaIngreso>('COBRO_FACTURA');
  const [categoriaEgreso, setCategoriaEgreso] = useState<CategoriaEgreso>('MATERIALES');
  const [comprobante, setComprobante] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Vinculaciones
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [obraId, setObraId] = useState<number | ''>('');
  const [ticketId, setTicketId] = useState<number | ''>('');

  // Search states
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // Load cuentas on mount
  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const data = await finanzasApi.getCuentas();
        setCuentas(data.filter((c) => c.activa));
      } catch (error) {
        console.error('Error fetching cuentas:', error);
      }
    };
    fetchCuentas();
  }, []);

  // Load clientes on mount
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.get('/clients?limit=1000');
        setClientes(res.data.data || []);
      } catch (error) {
        console.error('Error fetching clientes:', error);
      }
    };
    fetchClientes();
  }, []);

  // Load obras when cliente changes
  useEffect(() => {
    if (!clienteId) {
      setObras([]);
      setObraId('');
      return;
    }
    const fetchObras = async () => {
      try {
        const res = await api.get(`/obras?clienteId=${clienteId}&limit=100`);
        setObras(res.data.data || []);
      } catch (error) {
        console.error('Error fetching obras:', error);
      }
    };
    fetchObras();
  }, [clienteId]);

  // Load tickets on mount (últimos 100)
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets?limit=100');
        setTickets(res.data.data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };
    fetchTickets();
  }, []);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTipo('INGRESO');
    setCuentaId('');
    setMonto('');
    setFechaMovimiento(new Date().toISOString().split('T')[0]);
    setMedioPago('TRANSFERENCIA');
    setCategoriaIngreso('COBRO_FACTURA');
    setCategoriaEgreso('MATERIALES');
    setComprobante('');
    setDescripcion('');
    setClienteId('');
    setObraId('');
    setTicketId('');
    setClienteSearch('');
  };

  const handleSave = async () => {
    if (!cuentaId) {
      alert('Seleccione una cuenta');
      return;
    }
    if (!monto || Number(monto) <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    if (!descripcion) {
      alert('Ingrese una descripción');
      return;
    }

    try {
      setIsLoading(true);
      const data = {
        tipo,
        cuentaId: Number(cuentaId),
        monto: Number(monto),
        fechaMovimiento: new Date(fechaMovimiento).toISOString(),
        medioPago,
        categoriaIngreso: tipo === 'INGRESO' ? categoriaIngreso : null,
        categoriaEgreso: tipo === 'EGRESO' ? categoriaEgreso : null,
        comprobante: comprobante || null,
        descripcion,
        clienteId: clienteId || null,
        obraId: obraId || null,
        ticketId: ticketId || null,
      };

      await finanzasApi.createMovimiento(data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating movimiento:', error);
      alert('Error al crear el movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClientes = clientes
    .filter((c) => c.razonSocial.toLowerCase().includes(clienteSearch.toLowerCase()))
    .slice(0, 10);

  const selectedCliente = clientes.find((c) => c.id === clienteId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-lg z-50 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${tipo === 'INGRESO' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
              >
                {tipo === 'INGRESO' ? (
                  <ArrowUpCircle className="h-5 w-5" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Nuevo Movimiento
                </h2>
                <p className="text-xs text-slate-500">
                  {tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar egreso'}
                </p>
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
            {/* Tipo Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Movimiento *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('INGRESO')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                    tipo === 'INGRESO'
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <ArrowUpCircle className="h-5 w-5" />
                  INGRESO
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('EGRESO')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-bold transition-all ${
                    tipo === 'EGRESO'
                      ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <ArrowDownCircle className="h-5 w-5" />
                  EGRESO
                </button>
              </div>
            </div>

            {/* Cuenta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Building2 className="inline h-4 w-4 mr-1" />
                Cuenta *
              </label>
              <select
                value={cuentaId}
                onChange={(e) => setCuentaId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.banco?.nombreCorto || c.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Monto y Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Monto *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full h-10 pl-7 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fechaMovimiento}
                  onChange={(e) => setFechaMovimiento(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Medio de Pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Medio de Pago *
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
              >
                {MEDIOS_PAGO.map((mp) => (
                  <option key={mp} value={mp}>
                    {MEDIO_PAGO_LABELS[mp]}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              {tipo === 'INGRESO' ? (
                <select
                  value={categoriaIngreso}
                  onChange={(e) => setCategoriaIngreso(e.target.value as CategoriaIngreso)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                >
                  {CATEGORIAS_INGRESO.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_INGRESO_LABELS[cat]}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={categoriaEgreso}
                  onChange={(e) => setCategoriaEgreso(e.target.value as CategoriaEgreso)}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                >
                  {CATEGORIAS_EGRESO.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_EGRESO_LABELS[cat]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Comprobante */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Comprobante
              </label>
              <input
                type="text"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Nro de factura, recibo, etc."
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descripción *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Detalle del movimiento..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand resize-none"
              />
            </div>

            {/* Vinculaciones */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Vincular a (opcional)
              </h3>

              {/* Cliente Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Cliente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={selectedCliente ? selectedCliente.razonSocial : clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      setClienteId('');
                      setShowClienteDropdown(true);
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    placeholder="Buscar cliente..."
                    className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                  />
                  {showClienteDropdown && clienteSearch && filteredClientes.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowClienteDropdown(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                        {filteredClientes.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setClienteId(c.id);
                              setClienteSearch('');
                              setShowClienteDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {c.razonSocial}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Obra */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Wrench className="inline h-4 w-4 mr-1" />
                  Obra
                </label>
                <select
                  value={obraId}
                  onChange={(e) => setObraId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!clienteId}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand disabled:opacity-60"
                >
                  <option value="">
                    {clienteId ? 'Sin vincular' : 'Seleccione cliente primero'}
                  </option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.codigo} - {o.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Ticket className="inline h-4 w-4 mr-1" />
                  Ticket
                </label>
                <select
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
                >
                  <option value="">Sin vincular</option>
                  {tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      TKT-{String(t.codigoInterno).padStart(5, '0')} -{' '}
                      {t.descripcion.substring(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 ${
                tipo === 'INGRESO'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Save className="h-4 w-4" />
              Registrar {tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
