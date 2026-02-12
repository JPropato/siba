import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Ban,
  Search,
  Loader2,
  ChevronDown,
  DollarSign,
  Eye,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { CollapsibleFilters } from '../../../components/layout/CollapsibleFilters';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Select } from '../../../components/ui/core/Select';
import { Button } from '../../../components/ui/core/Button';
import { useConfirm } from '../../../hooks/useConfirm';
import type {
  FacturaProveedor,
  TipoComprobante,
  EstadoFacturaProveedor,
  CreateFacturaDto,
} from '../types';
import { TIPO_COMPROBANTE_LABELS, ESTADO_FACTURA_CONFIG } from '../types';
import {
  useFacturasProveedor,
  useCreateFactura,
  useUpdateFactura,
  useAnularFactura,
  useFacturaProveedor,
  useRegistrarPago,
} from '../hooks/useFacturas';
import { useProveedores } from '../hooks/useProveedores';
import { comprasApi } from '../api/comprasApi';
import { finanzasApi } from '../../finanzas/api/finanzasApi';
import { obrasApi } from '../../obras/api/obrasApi';
import { MEDIO_PAGO_LABELS } from '../../finanzas/types';
import type { MedioPago } from '../../finanzas/types';

// --- Option arrays for selects ---

const TIPO_COMPROBANTE_OPTIONS = Object.entries(TIPO_COMPROBANTE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ESTADO_FACTURA_OPTIONS = Object.entries(ESTADO_FACTURA_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const MEDIO_PAGO_OPTIONS = Object.entries(MEDIO_PAGO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// --- Helpers ---

const fmt = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

const padPV = (n: number) => String(n).padStart(4, '0');

const numVal = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// --- Component ---

export default function FacturasPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<FacturaProveedor | null>(null);

  // Retenciones collapsible
  const [showRetenciones, setShowRetenciones] = useState(false);

  // Form state
  const [formProveedorId, setFormProveedorId] = useState('');
  const [formTipo, setFormTipo] = useState<string>('FACTURA_A');
  const [formPuntoVenta, setFormPuntoVenta] = useState('');
  const [formNumero, setFormNumero] = useState('');
  const [formFechaEmision, setFormFechaEmision] = useState('');
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');
  const [formSubtotal, setFormSubtotal] = useState('');
  const [formIva21, setFormIva21] = useState('');
  const [formIva105, setFormIva105] = useState('');
  const [formIva27, setFormIva27] = useState('');
  const [formExento, setFormExento] = useState('');
  const [formNoGravado, setFormNoGravado] = useState('');
  const [formPercIIBB, setFormPercIIBB] = useState('');
  const [formPercIva, setFormPercIva] = useState('');
  const [formOtrosImp, setFormOtrosImp] = useState('');
  const [formRetGanancias, setFormRetGanancias] = useState('');
  const [formRetIva, setFormRetIva] = useState('');
  const [formRetIIBB, setFormRetIIBB] = useState('');
  const [formRetSUSS, setFormRetSUSS] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  // Classification fields
  const [showClasificacion, setShowClasificacion] = useState(false);
  const [formCuentaContableId, setFormCuentaContableId] = useState('');
  const [formCentroCostoId, setFormCentroCostoId] = useState('');
  const [formObraId, setFormObraId] = useState('');

  // Detail drawer
  const [detalleFacturaId, setDetalleFacturaId] = useState<number | null>(null);

  // Pago dialog
  const [pagoFactura, setPagoFactura] = useState<FacturaProveedor | null>(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoFecha, setPagoFecha] = useState('');
  const [pagoMedioPago, setPagoMedioPago] = useState<string>('TRANSFERENCIA');
  const [pagoCuentaId, setPagoCuentaId] = useState('');
  const [pagoChequeId, setPagoChequeId] = useState('');
  const [pagoObservaciones, setPagoObservaciones] = useState('');

  // Query params (for tile navigation)
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-calculate total
  const calculatedTotal = useMemo(() => {
    return (
      numVal(formSubtotal) +
      numVal(formIva21) +
      numVal(formIva105) +
      numVal(formIva27) +
      numVal(formExento) +
      numVal(formNoGravado) +
      numVal(formPercIIBB) +
      numVal(formPercIva) +
      numVal(formOtrosImp)
    );
  }, [
    formSubtotal,
    formIva21,
    formIva105,
    formIva27,
    formExento,
    formNoGravado,
    formPercIIBB,
    formPercIva,
    formOtrosImp,
  ]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Queries
  const { data, isLoading, refetch } = useFacturasProveedor({
    search: debouncedSearch || undefined,
    proveedorId: filterProveedor ? Number(filterProveedor) : undefined,
    estado: (filterEstado as EstadoFacturaProveedor) || undefined,
    page,
    limit: 20,
  });
  const facturas = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const { data: provData } = useProveedores({ limit: 100 });
  const proveedoresOptions = useMemo(
    () =>
      (provData?.data ?? []).map((p) => ({
        value: String(p.id),
        label: `${p.razonSocial} (${p.cuit})`,
      })),
    [provData]
  );

  // Reference data queries
  const { data: cuentasContablesData } = useQuery({
    queryKey: ['finanzas', 'cuentas-contables', 'imputables'],
    queryFn: () => finanzasApi.getCuentasContables({ imputable: true }),
  });
  const cuentasContablesOptions = useMemo(
    () =>
      (cuentasContablesData ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.codigo} - ${c.nombre}`,
      })),
    [cuentasContablesData]
  );

  const { data: centrosCostoData } = useQuery({
    queryKey: ['finanzas', 'centros-costo'],
    queryFn: () => finanzasApi.getCentrosCosto(),
  });
  const centrosCostoOptions = useMemo(
    () =>
      (centrosCostoData ?? [])
        .filter((c) => c.activo)
        .map((c) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` })),
    [centrosCostoData]
  );

  const { data: obrasData } = useQuery({
    queryKey: ['obras', 'all'],
    queryFn: () => obrasApi.getAll({ limit: 200 }),
  });
  const obrasOptions = useMemo(
    () =>
      (obrasData?.data ?? []).map((o) => ({
        value: String(o.id),
        label: `${o.codigo} - ${o.titulo}`,
      })),
    [obrasData]
  );

  const { data: cuentasFinancierasData } = useQuery({
    queryKey: ['finanzas', 'cuentas'],
    queryFn: () => finanzasApi.getCuentas(),
  });
  const cuentasFinancierasOptions = useMemo(
    () =>
      (cuentasFinancierasData ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ value: String(c.id), label: c.nombre })),
    [cuentasFinancierasData]
  );

  // Conditional: cheques en cartera when paying with CHEQUE/ECHEQ
  const showChequeSelector = pagoMedioPago === 'CHEQUE' || pagoMedioPago === 'ECHEQ';
  const { data: chequesCarteraData } = useQuery({
    queryKey: ['compras', 'cheques', 'cartera', pagoMedioPago],
    queryFn: () =>
      comprasApi.getCheques({
        estado: 'CARTERA',
        tipo: pagoMedioPago === 'ECHEQ' ? 'ECHEQ' : 'FISICO',
        limit: 100,
      }),
    enabled: showChequeSelector,
  });
  const chequesCarteraOptions = useMemo(
    () =>
      (chequesCarteraData?.data ?? []).map((ch) => ({
        value: String(ch.id),
        label: `${ch.numero} - ${ch.bancoEmisor} (${fmt(ch.monto)})`,
      })),
    [chequesCarteraData]
  );

  // Detail drawer query
  const { data: facturaDetalle } = useFacturaProveedor(detalleFacturaId);

  // Mutations
  const createMutation = useCreateFactura();
  const updateMutation = useUpdateFactura();
  const anularMutation = useAnularFactura();
  const registrarPagoMutation = useRegistrarPago();
  const { confirm, ConfirmDialog } = useConfirm();

  // Form helpers
  const resetForm = useCallback(() => {
    setFormProveedorId('');
    setFormTipo('FACTURA_A');
    setFormPuntoVenta('');
    setFormNumero('');
    setFormFechaEmision('');
    setFormFechaVencimiento('');
    setFormSubtotal('');
    setFormIva21('');
    setFormIva105('');
    setFormIva27('');
    setFormExento('');
    setFormNoGravado('');
    setFormPercIIBB('');
    setFormPercIva('');
    setFormOtrosImp('');
    setFormRetGanancias('');
    setFormRetIva('');
    setFormRetIIBB('');
    setFormRetSUSS('');
    setFormDescripcion('');
    setShowRetenciones(false);
    setShowClasificacion(false);
    setFormCuentaContableId('');
    setFormCentroCostoId('');
    setFormObraId('');
  }, []);

  const handleCreate = useCallback(() => {
    setEditingFactura(null);
    resetForm();
    setIsDrawerOpen(true);
  }, [resetForm]);

  // Read query params on mount
  useEffect(() => {
    const estadoParam = searchParams.get('estado');
    if (estadoParam) {
      setFilterEstado(estadoParam);
      setSearchParams({}, { replace: true });
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'create') {
      handleCreate();
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const activeFiltersCount = (search ? 1 : 0) + (filterProveedor ? 1 : 0) + (filterEstado ? 1 : 0);

  // --- Form handlers (moved up) ---

  const handleEdit = (fac: FacturaProveedor) => {
    setEditingFactura(fac);
    setFormProveedorId(String(fac.proveedorId));
    setFormTipo(fac.tipoComprobante);
    setFormPuntoVenta(String(fac.puntoVenta));
    setFormNumero(fac.numeroComprobante);
    setFormFechaEmision(fac.fechaEmision?.slice(0, 10) ?? '');
    setFormFechaVencimiento(fac.fechaVencimiento?.slice(0, 10) ?? '');
    setFormSubtotal(String(fac.subtotal));
    setFormIva21(String(fac.montoIva21));
    setFormIva105(String(fac.montoIva105));
    setFormIva27(String(fac.montoIva27));
    setFormExento(String(fac.montoExento));
    setFormNoGravado(String(fac.montoNoGravado));
    setFormPercIIBB(String(fac.percepcionIIBB));
    setFormPercIva(String(fac.percepcionIva));
    setFormOtrosImp(String(fac.otrosImpuestos));
    setFormRetGanancias(String(fac.retencionGanancias));
    setFormRetIva(String(fac.retencionIva));
    setFormRetIIBB(String(fac.retencionIIBB));
    setFormRetSUSS(String(fac.retencionSUSS));
    setFormDescripcion(fac.descripcion ?? '');
    setShowRetenciones(
      fac.retencionGanancias > 0 ||
        fac.retencionIva > 0 ||
        fac.retencionIIBB > 0 ||
        fac.retencionSUSS > 0
    );
    setFormCuentaContableId(fac.cuentaContableId ? String(fac.cuentaContableId) : '');
    setFormCentroCostoId(fac.centroCostoId ? String(fac.centroCostoId) : '');
    setFormObraId(fac.obraId ? String(fac.obraId) : '');
    setShowClasificacion(!!fac.cuentaContableId || !!fac.centroCostoId || !!fac.obraId);
    setIsDrawerOpen(true);
  };

  const handleAnular = async (fac: FacturaProveedor) => {
    const ok = await confirm({
      title: 'Anular factura',
      message: `¿Anular la factura ${TIPO_COMPROBANTE_LABELS[fac.tipoComprobante]} ${padPV(fac.puntoVenta)}-${fac.numeroComprobante}? Esta accion no se puede deshacer.`,
      confirmLabel: 'Anular',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await anularMutation.mutateAsync(fac.id);
      toast.success('Factura anulada');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al anular');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProveedorId || !formTipo || !formPuntoVenta || !formNumero || !formFechaEmision) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const dto: CreateFacturaDto = {
      proveedorId: Number(formProveedorId),
      tipoComprobante: formTipo as TipoComprobante,
      puntoVenta: Number(formPuntoVenta),
      numeroComprobante: formNumero,
      fechaEmision: formFechaEmision,
      fechaVencimiento: formFechaVencimiento || null,
      subtotal: numVal(formSubtotal),
      montoIva21: numVal(formIva21),
      montoIva105: numVal(formIva105),
      montoIva27: numVal(formIva27),
      montoExento: numVal(formExento),
      montoNoGravado: numVal(formNoGravado),
      percepcionIIBB: numVal(formPercIIBB),
      percepcionIva: numVal(formPercIva),
      otrosImpuestos: numVal(formOtrosImp),
      total: calculatedTotal,
      retencionGanancias: numVal(formRetGanancias),
      retencionIva: numVal(formRetIva),
      retencionIIBB: numVal(formRetIIBB),
      retencionSUSS: numVal(formRetSUSS),
      descripcion: formDescripcion || null,
      cuentaContableId: formCuentaContableId ? Number(formCuentaContableId) : null,
      centroCostoId: formCentroCostoId ? Number(formCentroCostoId) : null,
      obraId: formObraId ? Number(formObraId) : null,
    };

    try {
      if (editingFactura) {
        await updateMutation.mutateAsync({ id: editingFactura.id, data: dto });
        toast.success('Factura actualizada');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Factura creada');
      }
      setIsDrawerOpen(false);
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al guardar');
    }
  };

  // --- Pago handlers ---
  const handleOpenPago = (fac: FacturaProveedor) => {
    setPagoFactura(fac);
    setPagoMonto(String(fac.saldoPendiente));
    setPagoFecha(new Date().toISOString().slice(0, 10));
    setPagoMedioPago('TRANSFERENCIA');
    setPagoCuentaId('');
    setPagoChequeId('');
    setPagoObservaciones('');
  };

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoFactura || !pagoCuentaId || !pagoMonto) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      await registrarPagoMutation.mutateAsync({
        facturaId: pagoFactura.id,
        monto: numVal(pagoMonto),
        fechaPago: pagoFecha,
        medioPago: pagoMedioPago,
        cuentaId: Number(pagoCuentaId),
        chequeId: pagoChequeId ? Number(pagoChequeId) : null,
        observaciones: pagoObservaciones || null,
      });
      toast.success('Pago registrado. Se creo movimiento de egreso.');
      setPagoFactura(null);
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al registrar pago');
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<FileText className="h-5 w-5" />}
          breadcrumb={['Compras', 'Facturas']}
          title="Facturas de Proveedor"
          subtitle={`${data?.pagination?.total ?? 0} facturas`}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nueva Factura
            </button>
          }
        />

        <CollapsibleFilters activeFiltersCount={activeFiltersCount}>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por numero o proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
            </div>
            <div className="w-48">
              <Select
                options={[{ value: '', label: 'Todos los proveedores' }, ...proveedoresOptions]}
                value={filterProveedor}
                onChange={(v) => {
                  setFilterProveedor(v);
                  setPage(1);
                }}
                placeholder="Proveedor"
              />
            </div>
            <div className="w-40">
              <Select
                options={[{ value: '', label: 'Todos los estados' }, ...ESTADO_FACTURA_OPTIONS]}
                value={filterEstado}
                onChange={(v) => {
                  setFilterEstado(v);
                  setPage(1);
                }}
                placeholder="Estado"
              />
            </div>
          </div>
        </CollapsibleFilters>

        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : facturas.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6 text-brand" />}
            title="Sin facturas"
            description="Registre facturas de proveedor para llevar el control de compras."
          />
        ) : (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Tipo / Nro
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                      Proveedor
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right">
                      Total
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden lg:table-cell">
                      Pagado
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right hidden sm:table-cell">
                      Saldo
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Estado
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((fac) => {
                    const estadoCfg = ESTADO_FACTURA_CONFIG[fac.estado];
                    return (
                      <tr
                        key={fac.id}
                        onClick={() => setDetalleFacturaId(fac.id)}
                        className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-2.5">
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {TIPO_COMPROBANTE_LABELS[fac.tipoComprobante]} {padPV(fac.puntoVenta)}
                              -{fac.numeroComprobante}
                            </span>
                            <span className="block text-[10px] text-slate-400 md:hidden">
                              {fac.proveedor?.razonSocial}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {fac.proveedor?.razonSocial}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {fmtDate(fac.fechaEmision)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                            {fmt(fac.total)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right hidden lg:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                            {fmt(fac.montoPagado)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                            {fmt(fac.saldoPendiente)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${estadoCfg.bgColor} ${estadoCfg.color}`}
                          >
                            {estadoCfg.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {(fac.estado === 'PENDIENTE' || fac.estado === 'PAGO_PARCIAL') && (
                              <button
                                onClick={() => handleOpenPago(fac)}
                                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10"
                                title="Registrar Pago"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setDetalleFacturaId(fac.id)}
                              className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Ver detalle"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {fac.estado === 'PENDIENTE' && (
                              <button
                                onClick={() => handleEdit(fac)}
                                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {fac.estado !== 'ANULADA' && (
                              <button
                                onClick={() => handleAnular(fac)}
                                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                                title="Anular"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Drawer para crear/editar */}
        <DialogBase
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          type="drawer"
          maxWidth="md"
          title={editingFactura ? 'Editar Factura' : 'Nueva Factura'}
          icon={
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="factura-form"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingFactura ? 'Guardar Cambios' : 'Crear Factura'}
              </Button>
            </>
          }
        >
          <form id="factura-form" onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Proveedor *"
              options={proveedoresOptions}
              value={formProveedorId}
              onChange={(v) => setFormProveedorId(v)}
              placeholder="Seleccionar proveedor..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipo Comprobante *"
                options={TIPO_COMPROBANTE_OPTIONS}
                value={formTipo}
                onChange={(v) => setFormTipo(v)}
              />
              <Input
                label="Punto de Venta *"
                type="number"
                placeholder="0001"
                value={formPuntoVenta}
                onChange={(e) => setFormPuntoVenta(e.target.value)}
              />
            </div>

            <Input
              label="Numero Comprobante *"
              placeholder="00000123"
              value={formNumero}
              onChange={(e) => setFormNumero(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha Emision *"
                type="date"
                value={formFechaEmision}
                onChange={(e) => setFormFechaEmision(e.target.value)}
              />
              <Input
                label="Fecha Vencimiento"
                type="date"
                value={formFechaVencimiento}
                onChange={(e) => setFormFechaVencimiento(e.target.value)}
              />
            </div>

            {/* Montos */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Montos
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Subtotal"
                  type="number"
                  placeholder="0.00"
                  value={formSubtotal}
                  onChange={(e) => setFormSubtotal(e.target.value)}
                />
                <Input
                  label="IVA 21%"
                  type="number"
                  placeholder="0.00"
                  value={formIva21}
                  onChange={(e) => setFormIva21(e.target.value)}
                />
                <Input
                  label="IVA 10.5%"
                  type="number"
                  placeholder="0.00"
                  value={formIva105}
                  onChange={(e) => setFormIva105(e.target.value)}
                />
                <Input
                  label="IVA 27%"
                  type="number"
                  placeholder="0.00"
                  value={formIva27}
                  onChange={(e) => setFormIva27(e.target.value)}
                />
                <Input
                  label="Exento"
                  type="number"
                  placeholder="0.00"
                  value={formExento}
                  onChange={(e) => setFormExento(e.target.value)}
                />
                <Input
                  label="No Gravado"
                  type="number"
                  placeholder="0.00"
                  value={formNoGravado}
                  onChange={(e) => setFormNoGravado(e.target.value)}
                />
                <Input
                  label="Perc. IIBB"
                  type="number"
                  placeholder="0.00"
                  value={formPercIIBB}
                  onChange={(e) => setFormPercIIBB(e.target.value)}
                />
                <Input
                  label="Perc. IVA"
                  type="number"
                  placeholder="0.00"
                  value={formPercIva}
                  onChange={(e) => setFormPercIva(e.target.value)}
                />
                <Input
                  label="Otros Impuestos"
                  type="number"
                  placeholder="0.00"
                  value={formOtrosImp}
                  onChange={(e) => setFormOtrosImp(e.target.value)}
                />
                <div className="flex flex-col justify-end">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Total
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {fmt(calculatedTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Retenciones - collapsible */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRetenciones(!showRetenciones)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-brand transition-colors"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showRetenciones ? 'rotate-180' : ''}`}
                />
                Retenciones
              </button>
              {showRetenciones && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ret. Ganancias"
                    type="number"
                    placeholder="0.00"
                    value={formRetGanancias}
                    onChange={(e) => setFormRetGanancias(e.target.value)}
                  />
                  <Input
                    label="Ret. IVA"
                    type="number"
                    placeholder="0.00"
                    value={formRetIva}
                    onChange={(e) => setFormRetIva(e.target.value)}
                  />
                  <Input
                    label="Ret. IIBB"
                    type="number"
                    placeholder="0.00"
                    value={formRetIIBB}
                    onChange={(e) => setFormRetIIBB(e.target.value)}
                  />
                  <Input
                    label="Ret. SUSS"
                    type="number"
                    placeholder="0.00"
                    value={formRetSUSS}
                    onChange={(e) => setFormRetSUSS(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Clasificacion contable - collapsible */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClasificacion(!showClasificacion)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-brand transition-colors"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showClasificacion ? 'rotate-180' : ''}`}
                />
                Clasificacion Contable
              </button>
              {showClasificacion && (
                <div className="space-y-4">
                  <Select
                    label="Cuenta Contable"
                    options={[{ value: '', label: 'Sin asignar' }, ...cuentasContablesOptions]}
                    value={formCuentaContableId}
                    onChange={(v) => setFormCuentaContableId(v)}
                    placeholder="Seleccionar cuenta..."
                  />
                  <Select
                    label="Centro de Costo"
                    options={[{ value: '', label: 'Sin asignar' }, ...centrosCostoOptions]}
                    value={formCentroCostoId}
                    onChange={(v) => setFormCentroCostoId(v)}
                    placeholder="Seleccionar centro..."
                  />
                  <Select
                    label="Obra"
                    options={[{ value: '', label: 'Sin asignar' }, ...obrasOptions]}
                    value={formObraId}
                    onChange={(v) => setFormObraId(v)}
                    placeholder="Seleccionar obra..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descripcion
              </label>
              <textarea
                rows={2}
                placeholder="Descripcion o notas..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none text-slate-900 dark:text-white transition-all"
              />
            </div>
          </form>
        </DialogBase>

        {/* Dialog Registrar Pago */}
        <DialogBase
          isOpen={!!pagoFactura}
          onClose={() => setPagoFactura(null)}
          type="dialog"
          maxWidth="sm"
          title="Registrar Pago"
          icon={
            <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setPagoFactura(null)}>
                Cancelar
              </Button>
              <Button type="submit" form="pago-form" isLoading={registrarPagoMutation.isPending}>
                Registrar Pago
              </Button>
            </>
          }
        >
          {pagoFactura && (
            <form id="pago-form" onSubmit={handleSubmitPago} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm space-y-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  {TIPO_COMPROBANTE_LABELS[pagoFactura.tipoComprobante]}{' '}
                  {padPV(pagoFactura.puntoVenta)}-{pagoFactura.numeroComprobante}
                </p>
                <p className="text-slate-500">{pagoFactura.proveedor?.razonSocial}</p>
                <p className="text-slate-500">
                  Saldo pendiente:{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {fmt(pagoFactura.saldoPendiente)}
                  </span>
                </p>
              </div>

              <Input
                label="Monto *"
                type="number"
                placeholder="0.00"
                value={pagoMonto}
                onChange={(e) => setPagoMonto(e.target.value)}
              />

              <Input
                label="Fecha de Pago *"
                type="date"
                value={pagoFecha}
                onChange={(e) => setPagoFecha(e.target.value)}
              />

              <Select
                label="Medio de Pago *"
                options={MEDIO_PAGO_OPTIONS}
                value={pagoMedioPago}
                onChange={(v) => {
                  setPagoMedioPago(v);
                  setPagoChequeId('');
                }}
              />

              <Select
                label="Cuenta Financiera *"
                options={cuentasFinancierasOptions}
                value={pagoCuentaId}
                onChange={(v) => setPagoCuentaId(v)}
                placeholder="Seleccionar cuenta..."
              />

              {showChequeSelector && (
                <Select
                  label="Cheque en Cartera *"
                  options={chequesCarteraOptions}
                  value={pagoChequeId}
                  onChange={(v) => setPagoChequeId(v)}
                  placeholder="Seleccionar cheque..."
                />
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas del pago..."
                  value={pagoObservaciones}
                  onChange={(e) => setPagoObservaciones(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none text-slate-900 dark:text-white transition-all"
                />
              </div>
            </form>
          )}
        </DialogBase>

        {/* Drawer detalle factura */}
        <DialogBase
          isOpen={!!detalleFacturaId}
          onClose={() => setDetalleFacturaId(null)}
          type="drawer"
          maxWidth="md"
          title="Detalle de Factura"
          icon={
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          }
          footer={
            <Button variant="ghost" onClick={() => setDetalleFacturaId(null)}>
              Cerrar
            </Button>
          }
        >
          {facturaDetalle ? (
            <div className="space-y-5">
              {/* Header info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {TIPO_COMPROBANTE_LABELS[facturaDetalle.tipoComprobante]}{' '}
                    {padPV(facturaDetalle.puntoVenta)}-{facturaDetalle.numeroComprobante}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${ESTADO_FACTURA_CONFIG[facturaDetalle.estado].bgColor} ${ESTADO_FACTURA_CONFIG[facturaDetalle.estado].color}`}
                  >
                    {ESTADO_FACTURA_CONFIG[facturaDetalle.estado].label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {facturaDetalle.proveedor?.razonSocial}{' '}
                  {facturaDetalle.proveedor?.cuit && `(${facturaDetalle.proveedor.cuit})`}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Emision:</span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      {fmtDate(facturaDetalle.fechaEmision)}
                    </span>
                  </div>
                  {facturaDetalle.fechaVencimiento && (
                    <div>
                      <span className="text-slate-400">Vencimiento:</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">
                        {fmtDate(facturaDetalle.fechaVencimiento)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Montos */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Montos
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-right font-mono font-medium text-slate-900 dark:text-white">
                    {fmt(facturaDetalle.total)}
                  </span>
                  <span className="text-slate-400">Total a Pagar:</span>
                  <span className="text-right font-mono font-medium text-slate-900 dark:text-white">
                    {fmt(facturaDetalle.totalAPagar)}
                  </span>
                  <span className="text-slate-400">Pagado:</span>
                  <span className="text-right font-mono text-green-600">
                    {fmt(facturaDetalle.montoPagado)}
                  </span>
                  <span className="text-slate-400">Saldo Pendiente:</span>
                  <span className="text-right font-mono font-bold text-slate-900 dark:text-white">
                    {fmt(facturaDetalle.saldoPendiente)}
                  </span>
                </div>
              </div>

              {/* Clasificacion */}
              {(facturaDetalle.cuentaContable ||
                facturaDetalle.centroCosto ||
                facturaDetalle.obra) && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Clasificacion
                  </p>
                  <div className="space-y-1 text-sm">
                    {facturaDetalle.cuentaContable && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cuenta Contable:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {facturaDetalle.cuentaContable.codigo} -{' '}
                          {facturaDetalle.cuentaContable.nombre}
                        </span>
                      </div>
                    )}
                    {facturaDetalle.centroCosto && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Centro de Costo:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {facturaDetalle.centroCosto.codigo} - {facturaDetalle.centroCosto.nombre}
                        </span>
                      </div>
                    )}
                    {facturaDetalle.obra && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Obra:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {facturaDetalle.obra.codigo} - {facturaDetalle.obra.titulo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pagos realizados */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pagos Realizados
                  </p>
                  {(facturaDetalle.estado === 'PENDIENTE' ||
                    facturaDetalle.estado === 'PAGO_PARCIAL') && (
                    <button
                      onClick={() => {
                        setDetalleFacturaId(null);
                        handleOpenPago(facturaDetalle);
                      }}
                      className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium transition-colors"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Registrar Pago
                    </button>
                  )}
                </div>
                {facturaDetalle.pagos && facturaDetalle.pagos.length > 0 ? (
                  <div className="space-y-2">
                    {facturaDetalle.pagos.map((pago) => (
                      <div
                        key={pago.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                      >
                        <div>
                          <span className="text-slate-700 dark:text-slate-300">
                            {fmtDate(pago.fechaPago)}
                          </span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-slate-500">
                            {MEDIO_PAGO_LABELS[pago.medioPago as MedioPago] ?? pago.medioPago}
                          </span>
                          {pago.cheque && (
                            <>
                              <span className="mx-2 text-slate-300">|</span>
                              <span className="text-slate-500">Cheque {pago.cheque.numero}</span>
                            </>
                          )}
                          {pago.movimiento && (
                            <>
                              <span className="mx-2 text-slate-300">|</span>
                              <span className="text-slate-400 text-xs">
                                Mov. {pago.movimiento.codigo}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                          {fmt(pago.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sin pagos registrados</p>
                )}
              </div>
            </div>
          ) : detalleFacturaId ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 text-brand animate-spin" />
            </div>
          ) : null}
        </DialogBase>

        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
