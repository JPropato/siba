import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { obrasApi } from '../api/obrasApi';
import type { Obra, CreateObraDto, TipoObra, ModoEjecucion, EstadoObra } from '../types';
import { ESTADO_OBRA_CONFIG, TIPO_OBRA_CONFIG, MODO_EJECUCION_CONFIG } from '../types';
import {
  X,
  Building2,
  Wrench,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  Save,
  ChevronDown,
  Check,
  Paperclip,
  History,
  Briefcase,
} from 'lucide-react';
import api from '../../../lib/api';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { DatePicker } from '../../../components/ui/core/DatePicker';
import TabPresupuesto from './TabPresupuesto';
import TabArchivos from './TabArchivos';
import TabHistorial from './TabHistorial';

interface ObraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  obra: Obra | null;
  ticketId?: number | null;
  onSuccess: () => void;
}

interface Cliente {
  id: number;
  codigo: number;
  razonSocial: string;
}

interface Sucursal {
  id: number;
  codigoInterno: number;
  nombre: string;
  clienteId: number;
}

export default function ObraDrawer({
  isOpen,
  onClose,
  obra,
  ticketId,
  onSuccess,
}: ObraDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'general' | 'presupuesto' | 'gastos' | 'archivos' | 'historial'
  >('general');
  const [isLoading, setIsLoading] = useState(false);
  const [obraDetail, setObraDetail] = useState<Obra | null>(null);
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);

  // Form state
  const [tipo, setTipo] = useState<TipoObra>('OBRA_MAYOR');
  const [modoEjecucion, setModoEjecucion] = useState<ModoEjecucion>('CON_PRESUPUESTO');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date().toISOString().split('T')[0]);
  const [fechaInicioEstimada, setFechaInicioEstimada] = useState('');
  const [fechaFinEstimada, setFechaFinEstimada] = useState('');
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [sucursalId, setSucursalId] = useState<number | ''>('');
  const [condicionesPago, setCondicionesPago] = useState('');
  const [validezDias, setValidezDias] = useState(30);

  // Lookups
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const isEditing = !!obra;
  const isReadOnly = obra && obra.estado !== 'BORRADOR';

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

  // Load sucursales when cliente changes
  useEffect(() => {
    if (!clienteId) {
      setSucursales([]);
      setSucursalId('');
      return;
    }
    const fetchSucursales = async () => {
      try {
        const res = await api.get(`/sedes?clienteId=${clienteId}&limit=1000`);
        setSucursales(res.data.data || []);
      } catch (error) {
        console.error('Error fetching sucursales:', error);
      }
    };
    fetchSucursales();
  }, [clienteId]);

  // Load obra detail when editing
  useEffect(() => {
    if (obra) {
      loadObraDetail(obra.id);
    } else {
      resetForm();
    }
  }, [obra]);

  const loadObraDetail = async (id: number) => {
    try {
      setIsLoading(true);
      const detail = await obrasApi.getById(id);
      setObraDetail(detail);
      populateForm(detail);
    } catch (error) {
      console.error('Error loading obra:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (o: Obra) => {
    setTipo(o.tipo);
    setModoEjecucion(o.modoEjecucion);
    setTitulo(o.titulo);
    setDescripcion(o.descripcion || '');
    setFechaSolicitud(o.fechaSolicitud?.split('T')[0] || '');
    setFechaInicioEstimada(o.fechaInicioEstimada?.split('T')[0] || '');
    setFechaFinEstimada(o.fechaFinEstimada?.split('T')[0] || '');
    setClienteId(o.clienteId);
    setSucursalId(o.sucursalId || '');
    setCondicionesPago(o.condicionesPago || '');
    setValidezDias(o.validezDias || 30);
  };

  const resetForm = () => {
    setObraDetail(null);
    setTipo('OBRA_MAYOR');
    setModoEjecucion('CON_PRESUPUESTO');
    setTitulo('');
    setDescripcion('');
    setFechaSolicitud(new Date().toISOString().split('T')[0]);
    setFechaInicioEstimada('');
    setFechaFinEstimada('');
    setClienteId('');
    setSucursalId('');
    setCondicionesPago('');
    setValidezDias(30);
    setActiveTab('general');
  };

  const handleSave = async () => {
    if (!titulo || !clienteId || !fechaSolicitud) {
      toast.error('Complete los campos obligatorios: Título, Cliente y Fecha de Solicitud');
      return;
    }

    try {
      setIsLoading(true);
      const data: CreateObraDto = {
        tipo,
        modoEjecucion,
        titulo,
        descripcion: descripcion || null,
        fechaSolicitud: new Date(fechaSolicitud).toISOString(),
        fechaInicioEstimada: fechaInicioEstimada
          ? new Date(fechaInicioEstimada).toISOString()
          : null,
        fechaFinEstimada: fechaFinEstimada ? new Date(fechaFinEstimada).toISOString() : null,
        clienteId: Number(clienteId),
        sucursalId: sucursalId ? Number(sucursalId) : null,
        condicionesPago: condicionesPago || null,
        validezDias,
      };

      if (isEditing && obra) {
        await obrasApi.update(obra.id, data);
      } else {
        // Add ticketId if creating from a ticket
        if (ticketId) {
          data.ticketId = ticketId;
        }
        await obrasApi.create(data);
      }
      onSuccess();
      toast.success(isEditing ? 'Obra actualizada correctamente' : 'Obra creada correctamente');
    } catch (error) {
      console.error('Error saving obra:', error);
      toast.error('Error al guardar la obra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoObra) => {
    if (!obra) return;

    try {
      setIsLoading(true);
      setShowEstadoDropdown(false);

      // Validar que haya items antes de pasar a PRESUPUESTADO
      if (nuevoEstado === 'PRESUPUESTADO') {
        // Recargar datos frescos para validar
        const freshData = await obrasApi.getById(obra.id);
        const versionVigente = freshData.versiones?.find((v) => v.esVigente);
        const items = versionVigente?.items || [];
        const hasValidItems = items.length > 0 && items.some((item) => Number(item.cantidad) > 0);

        if (!hasValidItems) {
          toast.error(
            'No se puede presupuestar: Debe agregar al menos un item con cantidad mayor a 0'
          );
          setIsLoading(false);
          return;
        }
      }

      await obrasApi.cambiarEstado(obra.id, nuevoEstado);
      await loadObraDetail(obra.id);
      onSuccess();
      toast.success('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error changing estado:', error);
      toast.error('Error al cambiar el estado');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener las transiciones permitidas desde el estado actual
  const getTransicionesPermitidas = (
    estadoActual: EstadoObra,
    modo: ModoEjecucion
  ): { estado: EstadoObra; label: string; color: string }[] => {
    const transiciones: Record<EstadoObra, { estado: EstadoObra; label: string; color: string }[]> =
      {
        BORRADOR:
          modo === 'CON_PRESUPUESTO'
            ? [
                {
                  estado: 'PRESUPUESTADO',
                  label: 'Generar PDF y Presupuestar',
                  color: 'text-blue-600',
                },
              ]
            : [{ estado: 'EN_EJECUCION', label: 'Iniciar Ejecución', color: 'text-amber-600' }],
        PRESUPUESTADO: [
          { estado: 'APROBADO', label: 'Aprobar', color: 'text-green-600' },
          { estado: 'RECHAZADO', label: 'Rechazar', color: 'text-red-600' },
          { estado: 'BORRADOR', label: 'Reabrir para Edición', color: 'text-slate-600' },
        ],
        APROBADO: [{ estado: 'EN_EJECUCION', label: 'Iniciar Ejecución', color: 'text-amber-600' }],
        RECHAZADO: [{ estado: 'BORRADOR', label: 'Reabrir para Edición', color: 'text-slate-600' }],
        EN_EJECUCION: [{ estado: 'FINALIZADO', label: 'Finalizar Obra', color: 'text-purple-600' }],
        FINALIZADO: [{ estado: 'FACTURADO', label: 'Marcar Facturado', color: 'text-emerald-600' }],
        FACTURADO: [],
      };
    return transiciones[estadoActual] || [];
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  const tabs = [
    { id: 'general' as const, label: 'Datos Generales', icon: FileText },
    { id: 'presupuesto' as const, label: 'Presupuesto', icon: DollarSign },
    { id: 'gastos' as const, label: 'Gastos', icon: DollarSign },
    { id: 'archivos' as const, label: 'Archivos', icon: Paperclip },
    { id: 'historial' as const, label: 'Historial', icon: History },
  ];

  const displayObra = obraDetail || obra;
  const estadoConfig = displayObra ? ESTADO_OBRA_CONFIG[displayObra.estado] : null;

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-2xl z-[101] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {displayObra ? (
                displayObra.tipo === 'OBRA_MAYOR' ? (
                  <Building2 className="h-6 w-6 text-gold" />
                ) : (
                  <Wrench className="h-6 w-6 text-gold" />
                )
              ) : (
                <Building2 className="h-6 w-6 text-gold" />
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? displayObra?.codigo : 'Nueva Obra'}
                </h2>
              </div>
            </div>

            {/* Estado Dropdown */}
            {displayObra && estadoConfig && (
              <div className="relative">
                <button
                  onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                  disabled={
                    isLoading ||
                    getTransicionesPermitidas(displayObra.estado, displayObra.modoEjecucion)
                      .length === 0
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${estadoConfig.bgColor} ${estadoConfig.color} ${getTransicionesPermitidas(displayObra.estado, displayObra.modoEjecucion).length > 0 ? 'hover:opacity-80 cursor-pointer' : ''}`}
                >
                  {estadoConfig.label}
                  {getTransicionesPermitidas(displayObra.estado, displayObra.modoEjecucion).length >
                    0 && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showEstadoDropdown ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Dropdown Menu */}
                {showEstadoDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEstadoDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                      <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        Cambiar estado a:
                      </div>
                      {getTransicionesPermitidas(displayObra.estado, displayObra.modoEjecucion).map(
                        (transicion) => (
                          <button
                            key={transicion.estado}
                            onClick={() => {
                              if (confirm(`¿${transicion.label}?`)) {
                                handleCambiarEstado(transicion.estado);
                              } else {
                                setShowEstadoDropdown(false);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 ${transicion.color}`}
                          >
                            <Check className="h-4 w-4 opacity-0" />
                            {transicion.label}
                          </button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          {isEditing && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gold text-gold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : activeTab === 'general' ? (
            <div className="space-y-6">
              {/* Tipo y Modo */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo de Obra *"
                  options={Object.entries(TIPO_OBRA_CONFIG).map(([key, { label }]) => ({
                    value: key,
                    label,
                  }))}
                  value={tipo}
                  onChange={(val) => setTipo(val as TipoObra)}
                  disabled={!!isReadOnly}
                />
                <Select
                  label="Modo Ejecución"
                  options={Object.entries(MODO_EJECUCION_CONFIG).map(([key, { label }]) => ({
                    value: key,
                    label,
                  }))}
                  value={modoEjecucion}
                  onChange={(val) => setModoEjecucion(val as ModoEjecucion)}
                  disabled={!!isReadOnly}
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={!!isReadOnly}
                  placeholder="Descripción breve de la obra"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand disabled:opacity-60"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={!!isReadOnly}
                  rows={3}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand resize-none disabled:opacity-60"
                />
              </div>

              {/* Cliente y Sucursal */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Cliente *"
                  options={clientes.map((c) => ({
                    value: c.id,
                    label: c.razonSocial,
                    icon: <Briefcase className="h-4 w-4" />,
                  }))}
                  value={clienteId}
                  onChange={(val) => setClienteId(val ? Number(val) : '')}
                  disabled={!!isReadOnly}
                  placeholder="Seleccionar cliente..."
                />
                <Select
                  label="Sucursal"
                  options={sucursales.map((s) => ({
                    value: s.id,
                    label: s.nombre,
                    icon: <MapPin className="h-4 w-4" />,
                  }))}
                  value={sucursalId}
                  onChange={(val) => setSucursalId(val ? Number(val) : '')}
                  disabled={!!isReadOnly || !clienteId}
                  placeholder="Seleccionar sucursal..."
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-3 gap-4">
                <DatePicker
                  label="Fecha Solicitud *"
                  value={fechaSolicitud}
                  onChange={(val) => setFechaSolicitud(val || '')}
                  disabled={!!isReadOnly}
                />
                <DatePicker
                  label="Inicio Estimado"
                  value={fechaInicioEstimada}
                  onChange={(val) => setFechaInicioEstimada(val || '')}
                  disabled={!!isReadOnly}
                />
                <DatePicker
                  label="Fin Estimado"
                  value={fechaFinEstimada}
                  onChange={(val) => setFechaFinEstimada(val || '')}
                  disabled={!!isReadOnly}
                />
              </div>

              {/* Condiciones comerciales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    value={condicionesPago}
                    onChange={(e) => setCondicionesPago(e.target.value)}
                    disabled={!!isReadOnly}
                    placeholder="Ej: 50% anticipo, 50% contra entrega"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Validez (días)
                  </label>
                  <input
                    type="number"
                    value={validezDias}
                    onChange={(e) => setValidezDias(Number(e.target.value))}
                    disabled={!!isReadOnly}
                    min={1}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Info de solo lectura */}
              {isEditing && displayObra && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Monto Presupuestado:</span>
                      <span className="ml-2 font-mono font-semibold text-slate-900 dark:text-white">
                        {formatMonto(Number(displayObra.montoPresupuestado))}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Monto Gastado:</span>
                      <span className="ml-2 font-mono font-semibold text-slate-900 dark:text-white">
                        {formatMonto(Number(displayObra.montoGastado))}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Creado por:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">
                        {displayObra.creadoPor
                          ? `${displayObra.creadoPor.nombre} ${displayObra.creadoPor.apellido}`
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fecha creación:</span>
                      <span className="ml-2 text-slate-900 dark:text-white">
                        {formatDate(displayObra.fechaCreacion)}
                      </span>
                    </div>
                    {displayObra.ticket && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Ticket origen:</span>
                        <span className="ml-2 font-mono text-brand">
                          TKT-{String(displayObra.ticket.codigoInterno).padStart(5, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'presupuesto' ? (
            displayObra ? (
              <TabPresupuesto
                obraId={displayObra.id}
                isReadOnly={displayObra.estado !== 'BORRADOR'}
                onTotalsChange={() => loadObraDetail(displayObra.id)}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                Guarde la obra primero para agregar items al presupuesto
              </div>
            )
          ) : activeTab === 'gastos' ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tab Gastos - Próximamente (Fase 4.4)</p>
            </div>
          ) : activeTab === 'archivos' ? (
            displayObra ? (
              <TabArchivos
                obraId={displayObra.id}
                isReadOnly={displayObra.estado === 'FACTURADO'}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                Guarde la obra primero para agregar archivos
              </div>
            )
          ) : activeTab === 'historial' ? (
            displayObra ? (
              <TabHistorial obraId={displayObra.id} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                Guarde la obra primero para ver el historial
              </div>
            )
          ) : null}
        </div>

        {/* Footer */}
        {(!isEditing || !isReadOnly) && activeTab === 'general' && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isLoading}
                leftIcon={<Save className="h-4 w-4" />}
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Obra'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
