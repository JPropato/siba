import { Loader2, Pencil } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { presupuestoApi } from '../api/presupuestoApi';
import { obrasApi } from '../api/obrasApi';
import api from '@/lib/api';
import type {
  VersionPresupuesto,
  ItemPresupuesto,
  TipoItemPresupuesto,
  CreateItemDto,
  Material,
} from '../types';
import { TIPO_ITEM_CONFIG, UNIDADES_COMUNES } from '../types';
import {
  Plus,
  Trash2,
  Package,
  Users,
  Building,
  MoreHorizontal,
  GripVertical,
  Save,
  History,
  Search,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TabPresupuestoProps {
  obraId: number;
  isReadOnly?: boolean;
  onTotalsChange?: (subtotal: number, total: number) => void;
}

const ICON_MAP = {
  Package,
  Users,
  Building,
  MoreHorizontal,
};

export default function TabPresupuesto({
  obraId,
  isReadOnly = false,
  onTotalsChange,
}: TabPresupuestoProps) {
  const [version, setVersion] = useState<VersionPresupuesto | null>(null);
  const [versiones, setVersiones] = useState<VersionPresupuesto[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemPresupuesto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Material search
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Form state for new/edit item
  const [formData, setFormData] = useState<CreateItemDto>({
    tipo: 'MATERIAL',
    descripcion: '',
    cantidad: 1,
    unidad: 'u',
    costoUnitario: 0,
    precioUnitario: 0,
  });

  useEffect(() => {
    loadData();
    loadMaterials();
  }, [obraId]);

  const loadData = async (vId?: number) => {
    try {
      setIsLoading(true);
      const [presupuesto, listaVersiones] = await Promise.all([
        presupuestoApi.getPresupuesto(obraId, vId),
        presupuestoApi.getVersiones(obraId),
      ]);

      setVersion(presupuesto);
      setVersiones(listaVersiones as (VersionPresupuesto & { _count?: { items: number } })[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await api.get('/materials?limit=500');
      setMaterials(res.data.data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const filteredMaterials = useCallback(() => {
    if (!materialSearch) return materials.slice(0, 10);
    const search = materialSearch.toLowerCase();
    return materials
      .filter(
        (m) =>
          m.nombre.toLowerCase().includes(search) ||
          m.codigoArticulo.toLowerCase().includes(search) ||
          (m.descripcion && m.descripcion.toLowerCase().includes(search))
      )
      .slice(0, 10);
  }, [materials, materialSearch]);

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setMaterialSearch('');
    setShowMaterialDropdown(false);
    setFormData({
      ...formData,
      descripcion: `${material.codigoArticulo} - ${material.nombre}`,
      unidad: material.unidadMedida || 'u',
      costoUnitario: Number(material.precioCosto),
      precioUnitario: Number(material.precioVenta),
      materialId: material.id,
    });
  };

  const handleAddItem = async () => {
    if (!formData.descripcion) {
      alert('Ingrese una descripción');
      return;
    }

    try {
      setIsSaving(true);
      await presupuestoApi.addItem(obraId, formData);
      await loadData(); // Reload all to update totals and items
      onTotalsChange?.(Number(version?.subtotal || 0), Number(version?.total || 0));
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error al agregar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (
      !confirm(
        '¿Desea crear una nueva versión? La versión actual se guardará como historial y la nueva será la vigente.'
      )
    )
      return;

    try {
      setIsSaving(true);
      const newVersion = await presupuestoApi.createVersion(obraId);
      await loadData(newVersion.id);
      alert(`Versión ${newVersion.version} creada correctamente.`);
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error al crear nueva versión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchVersion = (vId: number) => {
    loadData(vId);
    setShowVersionHistory(false);
  };

  const handleGeneratePDF = async () => {
    if (!obraId || !version) return;
    try {
      setIsLoading(true);
      const result = await obrasApi.generarPDF(obraId, version.id);
      if (result.success && result.archivo?.url) {
        // Abrir PDF en nueva pestaña
        window.open(result.archivo.url, '_blank');
        // Recargar datos para actualizar estado de la obra y versión
        loadData(version.id);
        if (onTotalsChange) onTotalsChange(Number(version.subtotal), Number(version.total));
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      setIsSaving(true);
      await presupuestoApi.updateItem(obraId, editingItem.id, formData);
      await loadData();
      onTotalsChange?.(Number(version?.subtotal || 0), Number(version?.total || 0));
      resetForm();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error al actualizar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('¿Eliminar este item?')) return;

    try {
      await presupuestoApi.deleteItem(obraId, itemId);
      await loadData();
      onTotalsChange?.(Number(version?.subtotal || 0), Number(version?.total || 0));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar item');
    }
  };

  const startEdit = (item: ItemPresupuesto) => {
    setEditingItem(item);
    setSelectedMaterial(null);
    setFormData({
      tipo: item.tipo,
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      unidad: item.unidad,
      costoUnitario: Number(item.costoUnitario),
      precioUnitario: Number(item.precioUnitario),
      materialId: item.materialId,
    });
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      tipo: 'MATERIAL',
      descripcion: '',
      cantidad: 1,
      unidad: 'u',
      costoUnitario: 0,
      precioUnitario: 0,
    });
    setEditingItem(null);
    setSelectedMaterial(null);
    setMaterialSearch('');
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateSubtotal = () => {
    return formData.cantidad * formData.precioUnitario;
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || Package;
  };

  const effectiveReadOnly = isReadOnly || (version ? !version.esVigente : false);

  if (isLoading && !version) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con totales y versiones */}
      <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  showVersionHistory
                    ? 'bg-brand text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <History className="h-4 w-4" />v{version?.version}
                {version?.esVigente && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] rounded uppercase font-bold">
                    Vigente
                  </span>
                )}
              </button>

              {showVersionHistory && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700 font-medium text-xs text-slate-500 uppercase tracking-wider">
                    Historial de Versiones
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {versiones.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleSwitchVersion(v.id)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700 last:border-0 ${
                          v.id === version?.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              v{v.version}
                            </span>
                            {v.esVigente && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold uppercase">
                                OK
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDate(v.fechaCreacion)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                            {formatMoney(Number(v.total))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!effectiveReadOnly && (
              <button
                onClick={handleCreateVersion}
                disabled={isSaving}
                className="text-xs text-brand hover:underline flex items-center gap-1 disabled:opacity-50"
                title="Crear nueva versión"
                aria-label="Crear nueva versión basada en la actual"
              >
                <Plus className="h-3 w-3" />
                Nueva Versión
              </button>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase font-medium tracking-tight">
              Total Presupuestado
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {formatMoney(Number(version?.total || 0))}
            </div>
          </div>
        </div>

        {!effectiveReadOnly && !showAddForm && !editingItem && (
          <div className="flex justify-between items-center pt-1">
            <button
              onClick={handleGeneratePDF}
              disabled={isSaving || !version}
              className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              Generar PDF
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Agregar Item
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && !effectiveReadOnly && (
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-white">
            {editingItem ? 'Editar Item' : 'Nuevo Item'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => {
                  const newTipo = e.target.value as TipoItemPresupuesto;
                  setFormData({ ...formData, tipo: newTipo, materialId: undefined });
                  setSelectedMaterial(null);
                }}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                {Object.entries(TIPO_ITEM_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unidad
              </label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                {UNIDADES_COMUNES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Material Search - Solo visible cuando tipo es MATERIAL */}
          {formData.tipo === 'MATERIAL' && !editingItem && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Package className="inline h-4 w-4 mr-1" />
                Buscar Material del Catálogo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={(e) => {
                    setMaterialSearch(e.target.value);
                    setShowMaterialDropdown(true);
                  }}
                  onFocus={() => setShowMaterialDropdown(true)}
                  placeholder="Buscar por código o nombre..."
                  className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              {/* Material Dropdown */}
              {showMaterialDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredMaterials().length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      No se encontraron materiales
                    </div>
                  ) : (
                    filteredMaterials().map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => handleSelectMaterial(mat)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {mat.codigoArticulo} - {mat.nombre}
                            </div>
                            {mat.descripcion && (
                              <div className="text-xs text-slate-400 truncate max-w-xs">
                                {mat.descripcion}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold text-brand">
                              {formatMoney(Number(mat.precioVenta))}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(mat.fechaActualizacion)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setShowMaterialDropdown(false)}
                    className="w-full px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* Selected Material Info */}
              {selectedMaterial && (
                <div className="mt-2 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedMaterial.codigoArticulo} - {selectedMaterial.nombre}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMaterial(null);
                        setFormData({
                          ...formData,
                          descripcion: '',
                          materialId: undefined,
                        });
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span>Precio: {formatMoney(Number(selectedMaterial.precioVenta))}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Act: {formatDate(selectedMaterial.fechaActualizacion)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Descripción - Editable o si no es material */}
          {(formData.tipo !== 'MATERIAL' || editingItem || !selectedMaterial) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descripción *
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del item..."
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                min={0}
                step="0.01"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Costo Unit.
              </label>
              <input
                type="number"
                value={formData.costoUnitario}
                onChange={(e) =>
                  setFormData({ ...formData, costoUnitario: Number(e.target.value) })
                }
                min={0}
                step="0.01"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Precio Unit.
              </label>
              <input
                type="number"
                value={formData.precioUnitario}
                onChange={(e) =>
                  setFormData({ ...formData, precioUnitario: Number(e.target.value) })
                }
                min={0}
                step="0.01"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subtotal
              </label>
              <div className="h-10 px-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm flex items-center justify-end font-mono font-semibold">
                {formatMoney(calculateSubtotal())}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={isSaving}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {editingItem ? 'Guardar Cambios' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Descripción
              </th>
              <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300 w-20">
                Cant.
              </th>
              <th className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300 w-16">
                Unid.
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 w-28">
                P. Unit.
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 w-32">
                Subtotal
              </th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
            {!version?.items?.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay items en el presupuesto
                </td>
              </tr>
            ) : (
              version.items.map((item) => {
                const tipoConfig = TIPO_ITEM_CONFIG[item.tipo];
                const IconComponent = getIconComponent(tipoConfig.icon);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                      editingItem?.id === item.id ? 'bg-brand/5' : ''
                    }`}
                  >
                    <td className="px-2 py-3 text-slate-400">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {item.descripcion}
                          </div>
                          <div className="text-xs text-slate-400">{tipoConfig.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {Number(item.cantidad)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.unidad}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatMoney(Number(item.precioUnitario))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      <div>{formatMoney(Number(item.subtotal))}</div>
                      {item.material &&
                        Number(item.precioUnitario) !== Number(item.material.precioVenta) && (
                          <div
                            className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1 mt-1"
                            title="El precio en catálogo ha cambiado"
                          >
                            <AlertCircle className="h-3 w-3" />
                            Catálogo: {formatMoney(Number(item.material.precioVenta))}
                          </div>
                        )}
                      {item.material && (
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Act: {formatDate(item.material.fechaActualizacion)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!effectiveReadOnly && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded"
                            title="Editar"
                            aria-label="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                            title="Eliminar"
                            aria-label="Eliminar"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {version?.items?.length ? (
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300"
                >
                  TOTAL
                </td>
                <td className="px-4 py-3 text-right font-mono text-lg font-bold text-brand">
                  {formatMoney(Number(version.total))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {version && !version.esVigente && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            Estás viendo una <strong>versión histórica</strong> (v{version.version}). Para realizar
            cambios, debés seleccionar la{' '}
            <button
              onClick={() => {
                const vigente = versiones.find((v) => v.esVigente);
                if (vigente) handleSwitchVersion(vigente.id);
              }}
              className="underline font-bold"
            >
              versión vigente
            </button>
            .
          </span>
        </div>
      )}
    </div>
  );
}
