import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Search,
  Loader2,
  ArrowDownToLine,
  CircleCheckBig,
  ArrowRightLeft,
  XCircle,
  Ban,
  FileText,
  HandCoins,
  Banknote,
  CheckSquare,
  Square,
  CreditCard,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
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
import type { Cheque, TipoCheque, EstadoCheque, CreateChequeDto } from '../types';
import { ESTADO_CHEQUE_CONFIG, TIPO_CHEQUE_LABELS } from '../types';
import {
  useCheques,
  useCreateCheque,
  useUpdateCheque,
  useDepositarCheque,
  useCobrarCheque,
  useEndosarCheque,
  useRechazarCheque,
  useAnularCheque,
  useVenderCheque,
  useVenderBatchCheques,
  useAcreditarVentaCheques,
} from '../hooks/useCheques';
import { finanzasApi } from '../../finanzas/api/finanzasApi';

// --- Option arrays for filters and form selects ---

const TIPO_CHEQUE_OPTIONS = Object.entries(TIPO_CHEQUE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ESTADO_CHEQUE_OPTIONS = Object.entries(ESTADO_CHEQUE_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

// --- Helpers ---

const formatCurrency = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');

function calcularComision(monto: number, tasaPct: number, ivaPct: number) {
  const tasa = tasaPct / 100;
  const iva = ivaPct / 100;
  const comisionBruta = Math.round(monto * tasa * 100) / 100;
  const ivaDeComision = Math.round(comisionBruta * iva * 100) / 100;
  const totalDescuento = Math.round((comisionBruta + ivaDeComision) * 100) / 100;
  const montoNeto = Math.round((monto - totalDescuento) * 100) / 100;
  return { comisionBruta, ivaDeComision, totalDescuento, montoNeto };
}

// --- Component ---

export default function ChequesPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);

  // Main drawer (create / edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);

  // Form state
  const [formNumero, setFormNumero] = useState('');
  const [formTipo, setFormTipo] = useState<string>('FISICO');
  const [formBancoEmisor, setFormBancoEmisor] = useState('');
  const [formFechaEmision, setFormFechaEmision] = useState('');
  const [formFechaCobro, setFormFechaCobro] = useState('');
  const [formMonto, setFormMonto] = useState('');
  const [formBeneficiario, setFormBeneficiario] = useState('');
  const [formEmisor, setFormEmisor] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');

  // Action dialogs state
  const [depositarCheque, setDepositarCheque] = useState<Cheque | null>(null);
  const [depositarCuentaId, setDepositarCuentaId] = useState('');

  const [endosarCheque, setEndosarCheque] = useState<Cheque | null>(null);
  const [endosarA, setEndosarA] = useState('');

  const [rechazarCheque, setRechazarCheque] = useState<Cheque | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Vender individual dialog
  const [venderChequeItem, setVenderChequeItem] = useState<Cheque | null>(null);
  const [venderEntidad, setVenderEntidad] = useState('');
  const [venderTasa, setVenderTasa] = useState('7');
  const [venderIva, setVenderIva] = useState('21');

  // Multi-select for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Batch vender dialog
  const [batchVenderOpen, setBatchVenderOpen] = useState(false);
  const [batchEntidad, setBatchEntidad] = useState('');
  const [batchTasa, setBatchTasa] = useState('7');
  const [batchIva, setBatchIva] = useState('21');

  // Acreditar dialog
  const [acreditarCheques, setAcreditarCheques] = useState<Cheque[]>([]);
  const [acreditarCuentaId, setAcreditarCuentaId] = useState('');

  // Query params
  const [searchParams, setSearchParams] = useSearchParams();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Data queries
  const { data, isLoading, refetch } = useCheques({
    search: debouncedSearch,
    tipo: (filterTipo as TipoCheque) || undefined,
    estado: (filterEstado as EstadoCheque) || undefined,
    page,
    limit: 20,
  });
  const cheques = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const { data: cuentas = [] } = useQuery({
    queryKey: ['finanzas', 'cuentas'],
    queryFn: () => finanzasApi.getCuentas(),
  });

  // Mutations
  const createMutation = useCreateCheque();
  const updateMutation = useUpdateCheque();
  const depositarMutation = useDepositarCheque();
  const cobrarMutation = useCobrarCheque();
  const endosarMutation = useEndosarCheque();
  const rechazarMutation = useRechazarCheque();
  const anularMutation = useAnularCheque();
  const venderMutation = useVenderCheque();
  const venderBatchMutation = useVenderBatchCheques();
  const acreditarMutation = useAcreditarVentaCheques();
  const { confirm, ConfirmDialog } = useConfirm();

  // Form helpers
  const resetForm = useCallback(() => {
    setFormNumero('');
    setFormTipo('FISICO');
    setFormBancoEmisor('');
    setFormFechaEmision('');
    setFormFechaCobro('');
    setFormMonto('');
    setFormBeneficiario('');
    setFormEmisor('');
    setFormObservaciones('');
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCheque(null);
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

  // Clear selection when filters/page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch, filterTipo, filterEstado, page]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // --- Multi-select helpers ---

  const carteraCheques = useMemo(() => cheques.filter((c) => c.estado === 'CARTERA'), [cheques]);

  const allCarteraSelected =
    carteraCheques.length > 0 && carteraCheques.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allCarteraSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(carteraCheques.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCheques = useMemo(
    () => cheques.filter((c) => selectedIds.has(c.id)),
    [cheques, selectedIds]
  );

  const selectedTotal = useMemo(
    () => selectedCheques.reduce((sum, c) => sum + c.monto, 0),
    [selectedCheques]
  );

  // --- Pending acreditacion ---

  const pendingAcreditacion = useMemo(
    () => cheques.filter((c) => c.estado === 'VENDIDO' && !c.ventaMovimientoId),
    [cheques]
  );

  // Group pending by loteId
  const pendingLotes = useMemo(() => {
    const map = new Map<string, Cheque[]>();
    for (const c of pendingAcreditacion) {
      const key = c.ventaLoteId || `single-${c.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([loteId, chqs]) => ({
      loteId,
      cheques: chqs,
      entidad: chqs[0].ventaEntidad || '-',
      totalNeto: chqs.reduce((s, c) => s + (c.ventaMontoNeto ?? 0), 0),
    }));
  }, [pendingAcreditacion]);

  // --- Comision calculations ---

  const venderCalc = useMemo(() => {
    if (!venderChequeItem) return null;
    const tasa = parseFloat(venderTasa) || 0;
    const iva = parseFloat(venderIva) || 0;
    return calcularComision(venderChequeItem.monto, tasa, iva);
  }, [venderChequeItem, venderTasa, venderIva]);

  const batchCalc = useMemo(() => {
    if (selectedCheques.length === 0) return null;
    const tasa = parseFloat(batchTasa) || 0;
    const iva = parseFloat(batchIva) || 0;
    const totalBruto = selectedTotal;
    const result = calcularComision(totalBruto, tasa, iva);
    return { ...result, totalBruto };
  }, [selectedCheques.length, selectedTotal, batchTasa, batchIva]);

  // --- Form handlers (moved up) ---

  const handleEdit = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setFormNumero(cheque.numero);
    setFormTipo(cheque.tipo);
    setFormBancoEmisor(cheque.bancoEmisor);
    setFormFechaEmision(cheque.fechaEmision?.split('T')[0] || '');
    setFormFechaCobro(cheque.fechaCobro?.split('T')[0] || '');
    setFormMonto(String(cheque.monto));
    setFormBeneficiario(cheque.beneficiario || '');
    setFormEmisor(cheque.emisor || '');
    setFormObservaciones(cheque.observaciones || '');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formNumero ||
      !formTipo ||
      !formBancoEmisor ||
      !formFechaEmision ||
      !formFechaCobro ||
      !formMonto
    ) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    if (new Date(formFechaCobro) < new Date(formFechaEmision)) {
      toast.error('La fecha de cobro no puede ser anterior a la de emision');
      return;
    }
    const montoNum = parseFloat(formMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const dto: CreateChequeDto = {
      numero: formNumero,
      tipo: formTipo as TipoCheque,
      bancoEmisor: formBancoEmisor,
      fechaEmision: formFechaEmision,
      fechaCobro: formFechaCobro,
      monto: parseFloat(formMonto),
      beneficiario: formBeneficiario || null,
      emisor: formEmisor || null,
      observaciones: formObservaciones || null,
    };

    try {
      if (editingCheque) {
        await updateMutation.mutateAsync({ id: editingCheque.id, data: dto });
        toast.success('Cheque actualizado');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Cheque creado');
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

  // --- Action handlers ---

  const handleDepositar = async () => {
    if (!depositarCheque || !depositarCuentaId) {
      toast.error('Seleccione una cuenta destino');
      return;
    }
    try {
      await depositarMutation.mutateAsync({
        id: depositarCheque.id,
        cuentaDestinoId: Number(depositarCuentaId),
      });
      toast.success('Cheque depositado');
      setDepositarCheque(null);
      setDepositarCuentaId('');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al depositar');
    }
  };

  const handleCobrar = async (cheque: Cheque) => {
    const ok = await confirm({
      title: 'Cobrar cheque',
      message: `Confirmar cobro del cheque N° ${cheque.numero} por ${formatCurrency(cheque.monto)}?`,
      confirmLabel: 'Cobrar',
      variant: 'default',
    });
    if (!ok) return;
    try {
      await cobrarMutation.mutateAsync(cheque.id);
      toast.success('Cheque cobrado');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al cobrar');
    }
  };

  const handleEndosar = async () => {
    if (!endosarCheque || !endosarA.trim()) {
      toast.error('Ingrese a quien se endosa');
      return;
    }
    try {
      await endosarMutation.mutateAsync({
        id: endosarCheque.id,
        endosadoA: endosarA.trim(),
      });
      toast.success('Cheque endosado');
      setEndosarCheque(null);
      setEndosarA('');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al endosar');
    }
  };

  const handleRechazar = async () => {
    if (!rechazarCheque || !motivoRechazo.trim()) {
      toast.error('Ingrese el motivo de rechazo');
      return;
    }
    try {
      await rechazarMutation.mutateAsync({
        id: rechazarCheque.id,
        motivoRechazo: motivoRechazo.trim(),
      });
      toast.success('Cheque rechazado');
      setRechazarCheque(null);
      setMotivoRechazo('');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al rechazar');
    }
  };

  const handleAnular = async (cheque: Cheque) => {
    const ok = await confirm({
      title: 'Anular cheque',
      message: `Anular el cheque N° ${cheque.numero}? Esta accion no se puede deshacer.`,
      confirmLabel: 'Anular',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await anularMutation.mutateAsync(cheque.id);
      toast.success('Cheque anulado');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al anular');
    }
  };

  const handleVender = async () => {
    if (!venderChequeItem || !venderEntidad.trim()) {
      toast.error('Ingrese la entidad compradora');
      return;
    }
    const tasa = parseFloat(venderTasa) || 0;
    const iva = parseFloat(venderIva) || 0;
    if (tasa <= 0 || tasa > 100) {
      toast.error('La tasa de descuento debe estar entre 0 y 100');
      return;
    }
    try {
      await venderMutation.mutateAsync({
        id: venderChequeItem.id,
        entidadCompradora: venderEntidad.trim(),
        tasaDescuento: tasa / 100,
        ivaComision: iva / 100,
      });
      toast.success('Cheque marcado como vendido');
      setVenderChequeItem(null);
      setVenderEntidad('');
      setVenderTasa('7');
      setVenderIva('21');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al vender cheque');
    }
  };

  const handleVenderBatch = async () => {
    if (!batchEntidad.trim()) {
      toast.error('Ingrese la entidad compradora');
      return;
    }
    const tasa = parseFloat(batchTasa) || 0;
    const iva = parseFloat(batchIva) || 0;
    if (tasa <= 0 || tasa > 100) {
      toast.error('La tasa de descuento debe estar entre 0 y 100');
      return;
    }
    try {
      await venderBatchMutation.mutateAsync({
        chequeIds: Array.from(selectedIds),
        entidadCompradora: batchEntidad.trim(),
        tasaDescuento: tasa / 100,
        ivaComision: iva / 100,
      });
      toast.success(`${selectedIds.size} cheques marcados como vendidos`);
      setBatchVenderOpen(false);
      setBatchEntidad('');
      setBatchTasa('7');
      setBatchIva('21');
      setSelectedIds(new Set());
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al vender lote');
    }
  };

  const handleAcreditar = async () => {
    if (acreditarCheques.length === 0 || !acreditarCuentaId) {
      toast.error('Seleccione una cuenta destino');
      return;
    }
    try {
      await acreditarMutation.mutateAsync({
        chequeIds: acreditarCheques.map((c) => c.id),
        cuentaDestinoId: Number(acreditarCuentaId),
      });
      const totalNeto = acreditarCheques.reduce((s, c) => s + (c.ventaMontoNeto ?? 0), 0);
      toast.success(`Venta acreditada: ${formatCurrency(totalNeto)}`);
      setAcreditarCheques([]);
      setAcreditarCuentaId('');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al acreditar');
    }
  };

  // --- Filters count ---

  const activeFiltersCount = (search ? 1 : 0) + (filterTipo ? 1 : 0) + (filterEstado ? 1 : 0);

  // --- Cuentas options ---

  const cuentasOptions = cuentas.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }));

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Banknote className="h-5 w-5" />}
          breadcrumb={['Tesorería', 'Cheques']}
          title="Cheques"
          subtitle={`${data?.pagination?.total ?? 0} cheques`}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cheque
            </button>
          }
        />

        {/* Pending acreditacion alert */}
        {pendingLotes.length > 0 && (
          <div className="space-y-2">
            {pendingLotes.map((lote) => (
              <div
                key={lote.loteId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/20 p-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-orange-700 dark:text-orange-400">
                    <span className="font-bold">
                      {lote.cheques.length} cheque{lote.cheques.length > 1 ? 's' : ''}
                    </span>
                    {' vendido'}
                    {lote.cheques.length > 1 ? 's' : ''} a{' '}
                    <span className="font-semibold">{lote.entidad}</span> &middot; Neto:{' '}
                    <span className="font-bold">{formatCurrency(lote.totalNeto)}</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAcreditarCheques(lote.cheques);
                    setAcreditarCuentaId('');
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  Acreditar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <CollapsibleFilters activeFiltersCount={activeFiltersCount}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por numero o banco..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
              />
            </div>
            <div className="w-40">
              <Select
                label="Tipo"
                options={[{ value: '', label: 'Todos' }, ...TIPO_CHEQUE_OPTIONS]}
                value={filterTipo}
                onChange={(v) => {
                  setFilterTipo(v);
                  setPage(1);
                }}
                placeholder="Todos"
              />
            </div>
            <div className="w-44">
              <Select
                label="Estado"
                options={[{ value: '', label: 'Todos' }, ...ESTADO_CHEQUE_OPTIONS]}
                value={filterEstado}
                onChange={(v) => {
                  setFilterEstado(v);
                  setPage(1);
                }}
                placeholder="Todos"
              />
            </div>
          </div>
        </CollapsibleFilters>

        {/* Selection bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 dark:bg-brand/10 p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-brand" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedIds.size} cheque{selectedIds.size > 1 ? 's' : ''} seleccionado
                {selectedIds.size > 1 ? 's' : ''}
              </span>
              <span className="text-slate-500">&middot;</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(selectedTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Deseleccionar
              </button>
              <button
                onClick={() => {
                  setBatchVenderOpen(true);
                  setBatchEntidad('');
                  setBatchTasa('7');
                  setBatchIva('21');
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <HandCoins className="h-3.5 w-3.5" />
                Vender Lote
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : cheques.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6 text-brand" />}
            title="Sin cheques"
            description="Registre cheques recibidos para gestionar su cartera."
          />
        ) : (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-2 py-2 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-brand transition-colors"
                        title={
                          allCarteraSelected
                            ? 'Deseleccionar todos'
                            : 'Seleccionar todos en cartera'
                        }
                      >
                        {allCarteraSelected && carteraCheques.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-brand" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Numero
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Tipo
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                      Banco
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                      Fecha Cobro
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right">
                      Monto
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Estado
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right w-28">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cheques.map((cheque) => {
                    const estadoCfg = ESTADO_CHEQUE_CONFIG[cheque.estado];
                    const isSelectable = cheque.estado === 'CARTERA';
                    const isSelected = selectedIds.has(cheque.id);
                    return (
                      <tr
                        key={cheque.id}
                        className={`border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isSelected ? 'bg-brand/5 dark:bg-brand/10' : ''}`}
                      >
                        <td className="px-2 py-2.5">
                          {isSelectable ? (
                            <button
                              onClick={() => toggleSelect(cheque.id)}
                              className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-brand transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-brand" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                              {cheque.numero}
                            </span>
                            <span className="block text-[10px] text-slate-400 md:hidden">
                              {cheque.bancoEmisor}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {TIPO_CHEQUE_LABELS[cheque.tipo]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {cheque.bancoEmisor}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(cheque.fechaCobro)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(cheque.monto)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${estadoCfg.bgColor} ${estadoCfg.color}`}
                          >
                            {estadoCfg.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit - only when in CARTERA */}
                            {cheque.estado === 'CARTERA' && (
                              <button
                                onClick={() => handleEdit(cheque)}
                                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* CARTERA actions */}
                            {cheque.estado === 'CARTERA' && (
                              <>
                                <button
                                  onClick={() => {
                                    setDepositarCheque(cheque);
                                    setDepositarCuentaId('');
                                  }}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                  title="Depositar"
                                >
                                  <ArrowDownToLine className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEndosarCheque(cheque);
                                    setEndosarA('');
                                  }}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-purple-500 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10"
                                  title="Endosar"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setVenderChequeItem(cheque);
                                    setVenderEntidad('');
                                    setVenderTasa('7');
                                    setVenderIva('21');
                                  }}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10"
                                  title="Vender"
                                >
                                  <HandCoins className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAnular(cheque)}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                                  title="Anular"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {/* DEPOSITADO actions */}
                            {cheque.estado === 'DEPOSITADO' && (
                              <>
                                <button
                                  onClick={() => handleCobrar(cheque)}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10"
                                  title="Cobrar"
                                >
                                  <CircleCheckBig className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setRechazarCheque(cheque);
                                    setMotivoRechazo('');
                                  }}
                                  className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                                  title="Rechazar"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {/* VENDIDO without acreditacion */}
                            {cheque.estado === 'VENDIDO' && !cheque.ventaMovimientoId && (
                              <button
                                onClick={() => {
                                  setAcreditarCheques([cheque]);
                                  setAcreditarCuentaId('');
                                }}
                                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10"
                                title="Acreditar"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
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

        {/* ===== Main Drawer: Create / Edit cheque ===== */}
        <DialogBase
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          type="drawer"
          maxWidth="md"
          title={editingCheque ? 'Editar Cheque' : 'Nuevo Cheque'}
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
                form="cheque-form"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCheque ? 'Guardar Cambios' : 'Crear Cheque'}
              </Button>
            </>
          }
        >
          <form id="cheque-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Numero *"
                placeholder="00012345"
                value={formNumero}
                onChange={(e) => setFormNumero(e.target.value)}
              />
              <Select
                label="Tipo *"
                options={TIPO_CHEQUE_OPTIONS}
                value={formTipo}
                onChange={(v) => setFormTipo(v)}
              />
            </div>
            <Input
              label="Banco Emisor *"
              placeholder="Banco Nacion"
              value={formBancoEmisor}
              onChange={(e) => setFormBancoEmisor(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha Emision *"
                type="date"
                value={formFechaEmision}
                onChange={(e) => setFormFechaEmision(e.target.value)}
              />
              <Input
                label="Fecha Cobro *"
                type="date"
                value={formFechaCobro}
                onChange={(e) => setFormFechaCobro(e.target.value)}
              />
            </div>
            <Input
              label="Monto *"
              type="number"
              placeholder="0.00"
              value={formMonto}
              onChange={(e) => setFormMonto(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Beneficiario"
                placeholder="Nombre del beneficiario"
                value={formBeneficiario}
                onChange={(e) => setFormBeneficiario(e.target.value)}
              />
              <Input
                label="Emisor"
                placeholder="Nombre del emisor"
                value={formEmisor}
                onChange={(e) => setFormEmisor(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Observaciones internas..."
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none text-slate-900 dark:text-white transition-all"
              />
            </div>
          </form>
        </DialogBase>

        {/* ===== Depositar Dialog ===== */}
        <DialogBase
          isOpen={!!depositarCheque}
          onClose={() => {
            setDepositarCheque(null);
            setDepositarCuentaId('');
          }}
          type="dialog"
          maxWidth="sm"
          title="Depositar Cheque"
          icon={
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setDepositarCheque(null);
                  setDepositarCuentaId('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleDepositar} isLoading={depositarMutation.isPending}>
                Depositar
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {depositarCheque && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                <p className="text-slate-500">
                  Cheque N°{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {depositarCheque.numero}
                  </span>
                </p>
                <p className="text-slate-500">
                  Monto:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(depositarCheque.monto)}
                  </span>
                </p>
              </div>
            )}
            <Select
              label="Cuenta Destino *"
              options={cuentasOptions}
              value={depositarCuentaId}
              onChange={(v) => setDepositarCuentaId(v)}
              placeholder="Seleccionar cuenta..."
            />
          </div>
        </DialogBase>

        {/* ===== Endosar Dialog ===== */}
        <DialogBase
          isOpen={!!endosarCheque}
          onClose={() => {
            setEndosarCheque(null);
            setEndosarA('');
          }}
          type="dialog"
          maxWidth="sm"
          title="Endosar Cheque"
          icon={
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setEndosarCheque(null);
                  setEndosarA('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleEndosar} isLoading={endosarMutation.isPending}>
                Endosar
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {endosarCheque && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                <p className="text-slate-500">
                  Cheque N°{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {endosarCheque.numero}
                  </span>
                </p>
                <p className="text-slate-500">
                  Monto:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(endosarCheque.monto)}
                  </span>
                </p>
              </div>
            )}
            <Input
              label="Endosar a *"
              placeholder="Nombre o razon social del destinatario"
              value={endosarA}
              onChange={(e) => setEndosarA(e.target.value)}
            />
          </div>
        </DialogBase>

        {/* ===== Rechazar Dialog ===== */}
        <DialogBase
          isOpen={!!rechazarCheque}
          onClose={() => {
            setRechazarCheque(null);
            setMotivoRechazo('');
          }}
          type="dialog"
          maxWidth="sm"
          title="Rechazar Cheque"
          icon={
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setRechazarCheque(null);
                  setMotivoRechazo('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleRechazar} isLoading={rechazarMutation.isPending}>
                Rechazar
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {rechazarCheque && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                <p className="text-slate-500">
                  Cheque N°{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {rechazarCheque.numero}
                  </span>
                </p>
                <p className="text-slate-500">
                  Monto:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(rechazarCheque.monto)}
                  </span>
                </p>
              </div>
            )}
            <Input
              label="Motivo de Rechazo *"
              placeholder="Ej: Sin fondos suficientes"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            />
          </div>
        </DialogBase>

        {/* ===== Vender Individual Dialog ===== */}
        <DialogBase
          isOpen={!!venderChequeItem}
          onClose={() => setVenderChequeItem(null)}
          type="dialog"
          maxWidth="sm"
          title="Vender Cheque"
          icon={
            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <HandCoins className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setVenderChequeItem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleVender} isLoading={venderMutation.isPending}>
                Vender
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {venderChequeItem && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm">
                <p className="text-slate-500">
                  Cheque N°{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {venderChequeItem.numero}
                  </span>
                </p>
                <p className="text-slate-500">
                  Banco:{' '}
                  <span className="text-slate-900 dark:text-white">
                    {venderChequeItem.bancoEmisor}
                  </span>
                </p>
                <p className="text-slate-500">
                  Monto:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(venderChequeItem.monto)}
                  </span>
                </p>
              </div>
            )}
            <Input
              label="Entidad Compradora *"
              placeholder="Ej: Banco Nacion, Financiera XYZ"
              value={venderEntidad}
              onChange={(e) => setVenderEntidad(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tasa Descuento %"
                type="number"
                placeholder="7"
                value={venderTasa}
                onChange={(e) => setVenderTasa(e.target.value)}
              />
              <Input
                label="IVA s/Comision %"
                type="number"
                placeholder="21"
                value={venderIva}
                onChange={(e) => setVenderIva(e.target.value)}
              />
            </div>
            {venderCalc && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Monto bruto</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(venderChequeItem!.monto)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Comision ({venderTasa}%)</span>
                  <span className="text-red-500">-{formatCurrency(venderCalc.comisionBruta)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA comision ({venderIva}%)</span>
                  <span className="text-red-500">-{formatCurrency(venderCalc.ivaDeComision)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Neto a recibir</span>
                  <span className="text-green-600">{formatCurrency(venderCalc.montoNeto)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogBase>

        {/* ===== Vender Batch Dialog ===== */}
        <DialogBase
          isOpen={batchVenderOpen}
          onClose={() => setBatchVenderOpen(false)}
          type="dialog"
          maxWidth="md"
          title={`Vender ${selectedCheques.length} Cheques`}
          icon={
            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <HandCoins className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setBatchVenderOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleVenderBatch} isLoading={venderBatchMutation.isPending}>
                Vender {selectedCheques.length} cheques
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Cheques table */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-slate-500 text-xs">
                      Numero
                    </th>
                    <th className="px-3 py-1.5 text-left font-medium text-slate-500 text-xs hidden sm:table-cell">
                      Banco
                    </th>
                    <th className="px-3 py-1.5 text-left font-medium text-slate-500 text-xs hidden sm:table-cell">
                      F.Cobro
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium text-slate-500 text-xs">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCheques.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-white">
                        {c.numero}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 hidden sm:table-cell">
                        {c.bancoEmisor}
                      </td>
                      <td className="px-3 py-1.5 text-slate-500 hidden sm:table-cell">
                        {formatDate(c.fechaCobro)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(c.monto)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <td
                      colSpan={3}
                      className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-right"
                    >
                      Total
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(selectedTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Input
              label="Entidad Compradora *"
              placeholder="Ej: Banco Nacion, Financiera XYZ"
              value={batchEntidad}
              onChange={(e) => setBatchEntidad(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tasa Descuento %"
                type="number"
                placeholder="7"
                value={batchTasa}
                onChange={(e) => setBatchTasa(e.target.value)}
              />
              <Input
                label="IVA s/Comision %"
                type="number"
                placeholder="21"
                value={batchIva}
                onChange={(e) => setBatchIva(e.target.value)}
              />
            </div>

            {batchCalc && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Monto bruto</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(batchCalc.totalBruto)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Comision ({batchTasa}%)</span>
                  <span className="text-red-500">-{formatCurrency(batchCalc.comisionBruta)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA comision ({batchIva}%)</span>
                  <span className="text-red-500">-{formatCurrency(batchCalc.ivaDeComision)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total descuento</span>
                  <span className="text-red-500">-{formatCurrency(batchCalc.totalDescuento)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Neto a recibir</span>
                  <span className="text-green-600">{formatCurrency(batchCalc.montoNeto)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogBase>

        {/* ===== Acreditar Venta Dialog ===== */}
        <DialogBase
          isOpen={acreditarCheques.length > 0}
          onClose={() => {
            setAcreditarCheques([]);
            setAcreditarCuentaId('');
          }}
          type="dialog"
          maxWidth="sm"
          title="Acreditar Venta"
          icon={
            <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
              <CreditCard className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setAcreditarCheques([]);
                  setAcreditarCuentaId('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAcreditar} isLoading={acreditarMutation.isPending}>
                Acreditar{' '}
                {formatCurrency(acreditarCheques.reduce((s, c) => s + (c.ventaMontoNeto ?? 0), 0))}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm space-y-1">
              <p className="text-slate-500">
                Cheques:{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {acreditarCheques.length}
                </span>
              </p>
              {acreditarCheques[0]?.ventaEntidad && (
                <p className="text-slate-500">
                  Entidad:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {acreditarCheques[0].ventaEntidad}
                  </span>
                </p>
              )}
              <p className="text-slate-500">
                Neto total:{' '}
                <span className="font-bold text-green-600">
                  {formatCurrency(
                    acreditarCheques.reduce((s, c) => s + (c.ventaMontoNeto ?? 0), 0)
                  )}
                </span>
              </p>
            </div>
            <Select
              label="Cuenta Destino *"
              options={cuentasOptions}
              value={acreditarCuentaId}
              onChange={(v) => setAcreditarCuentaId(v)}
              placeholder="Donde se acredita el neto..."
            />
          </div>
        </DialogBase>

        {/* Confirm dialog (cobrar / anular) */}
        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
