import { useState, useEffect } from 'react';
import { Loader2, Settings, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { useConfigCategorias, useUpdateConfigCategoria, CATEGORIA_GASTO_CONFIG } from '..';
import { Button } from '../../../components/ui/core/Button';
import { Select } from '../../../components/ui/core/Select';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function ConfigCategoriasSection() {
  const { data: categorias, isLoading } = useConfigCategorias();
  const updateConfig = useUpdateConfigCategoria();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCuentaId, setSelectedCuentaId] = useState<string>('');
  const [cuentasContables, setCuentasContables] = useState<
    { id: number; codigo: string; nombre: string }[]
  >([]);
  const [isFetchingCuentas, setIsFetchingCuentas] = useState(false);

  useEffect(() => {
    if (editingId !== null) {
      const fetchCuentas = async () => {
        setIsFetchingCuentas(true);
        try {
          const res = await api.get('/finanzas/cuentas-contables', {
            params: { imputable: true, limit: 200 },
          });
          setCuentasContables(
            (res.data.data || []).map((c: { id: number; codigo: string; nombre: string }) => ({
              id: c.id,
              codigo: c.codigo,
              nombre: c.nombre,
            }))
          );
        } catch {
          toast.error('Error al cargar cuentas contables');
        } finally {
          setIsFetchingCuentas(false);
        }
      };
      fetchCuentas();
    }
  }, [editingId]);

  const handleEdit = (id: number, currentCuentaId: number) => {
    setEditingId(id);
    setSelectedCuentaId(currentCuentaId.toString());
  };

  const handleSave = async (id: number) => {
    if (!selectedCuentaId) {
      toast.error('Debe seleccionar una cuenta contable');
      return;
    }
    try {
      await updateConfig.mutateAsync({ id, cuentaContableId: Number(selectedCuentaId) });
      toast.success('Configuración actualizada');
      setEditingId(null);
    } catch {
      toast.error('Error al actualizar configuración');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setSelectedCuentaId('');
  };

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <Loader2 className="h-9 w-9 text-brand animate-spin" />
      </div>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <EmptyState
        icon={<Settings className="h-6 w-6 text-brand" />}
        title="Sin configuración"
        description="No se encontró configuración de categorías de gasto."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Configuración de Categorías de Gasto
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Asigne cuentas contables a cada categoría de gasto
          </p>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                  Categoría
                </th>
                <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                  Cuenta Contable
                </th>
                <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-center">
                  Activa
                </th>
                <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <td className="px-3 py-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {CATEGORIA_GASTO_CONFIG[cat.categoria]?.label || cat.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {editingId === cat.id ? (
                      <Select
                        label=""
                        options={cuentasContables.map((c) => ({
                          value: c.id.toString(),
                          label: `${c.codigo} - ${c.nombre}`,
                        }))}
                        value={selectedCuentaId}
                        onChange={setSelectedCuentaId}
                        isLoading={isFetchingCuentas}
                        placeholder="Seleccione cuenta..."
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-brand">
                          {cat.cuentaContable.codigo}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          {cat.cuentaContable.nombre}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        cat.activa
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}
                    >
                      {cat.activa ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-right">
                    {editingId === cat.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          leftIcon={<X className="h-4 w-4" />}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(cat.id)}
                          isLoading={updateConfig.isPending}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Guardar
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(cat.id, cat.cuentaContableId)}
                        className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand/50"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
