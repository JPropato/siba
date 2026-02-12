import { useState, useCallback, useMemo } from 'react';
import { BookOpen, Plus, Pencil, Power, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useConfirm } from '../../../hooks/useConfirm';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Select } from '../../../components/ui/core/Select';
import { Button } from '../../../components/ui/core/Button';
import type { CuentaContable, TipoCuentaContable } from '../types';
import { TIPO_CUENTA_CONTABLE_CONFIG } from '../types';
import {
  useCuentasContables,
  useCreateCuentaContable,
  useUpdateCuentaContable,
  useDeleteCuentaContable,
} from '../hooks/useCuentasContables';

interface TreeNode extends CuentaContable {
  children: TreeNode[];
}

function buildTree(cuentas: CuentaContable[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const c of cuentas) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const c of cuentas) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function TreeRow({
  node,
  level,
  expanded,
  onToggle,
  onEdit,
  onDeactivate,
}: {
  node: TreeNode;
  level: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (c: CuentaContable) => void;
  onDeactivate: (c: CuentaContable) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const config = TIPO_CUENTA_CONTABLE_CONFIG[node.tipo];

  return (
    <>
      <tr
        className={`border-b border-slate-100 dark:border-slate-800 ${
          !node.imputable ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-950'
        } hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors`}
      >
        <td className="px-3 py-2">
          <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <span
              className={`font-mono text-xs ${
                node.imputable
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-500 dark:text-slate-400 font-bold'
              }`}
            >
              {node.codigo}
            </span>
          </div>
        </td>
        <td className="px-3 py-2">
          <span
            className={`text-sm ${
              node.imputable
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-700 dark:text-slate-300 font-semibold'
            }`}
          >
            {node.nombre}
          </span>
          {node.descripcion && (
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{node.descripcion}</p>
          )}
        </td>
        <td className="px-3 py-2 hidden sm:table-cell">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.bgColor}`}
          >
            {config.label}
          </span>
        </td>
        <td className="px-3 py-2 text-center hidden lg:table-cell">
          {node.imputable ? (
            <span className="text-green-600 text-xs font-bold">Si</span>
          ) : (
            <span className="text-slate-400 text-xs">No</span>
          )}
        </td>
        <td className="px-2 py-2 text-right">
          {node.imputable && (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => onEdit(node)}
                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDeactivate(node)}
                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                title="Desactivar"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </td>
      </tr>
      {isExpanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        ))}
    </>
  );
}

const TIPOS: TipoCuentaContable[] = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'];

export default function CuentasContablesPage() {
  const { data: cuentas = [], isLoading, refetch } = useCuentasContables();
  const createMutation = useCreateCuentaContable();
  const updateMutation = useUpdateCuentaContable();
  const deleteMutation = useDeleteCuentaContable();
  const { confirm, ConfirmDialog } = useConfirm();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaContable | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState<TipoCuentaContable>('GASTO');
  const [formParentId, setFormParentId] = useState('');
  const [formImputable, setFormImputable] = useState(true);
  const [formDescripcion, setFormDescripcion] = useState('');

  const tree = useMemo(() => buildTree(cuentas), [cuentas]);

  // Expand all level 1 by default
  useState(() => {
    const level1Ids = cuentas.filter((c) => c.nivel === 1).map((c) => c.id);
    if (level1Ids.length > 0 && expanded.size === 0) {
      setExpanded(new Set(level1Ids));
    }
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(cuentas.filter((c) => !c.imputable).map((c) => c.id)));
  };

  const handleCreate = () => {
    setEditingCuenta(null);
    setFormCodigo('');
    setFormNombre('');
    setFormTipo('GASTO');
    setFormParentId('');
    setFormImputable(true);
    setFormDescripcion('');
    setIsDrawerOpen(true);
  };

  const handleEdit = (cuenta: CuentaContable) => {
    setEditingCuenta(cuenta);
    setFormCodigo(cuenta.codigo);
    setFormNombre(cuenta.nombre);
    setFormTipo(cuenta.tipo);
    setFormParentId(cuenta.parentId?.toString() || '');
    setFormImputable(cuenta.imputable);
    setFormDescripcion(cuenta.descripcion || '');
    setIsDrawerOpen(true);
  };

  const handleDeactivate = async (cuenta: CuentaContable) => {
    const confirmed = await confirm({
      title: 'Desactivar cuenta contable',
      message: `¿Desactivar la cuenta "${cuenta.codigo} - ${cuenta.nombre}"?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(cuenta.id);
      toast.success('Cuenta contable desactivada');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al desactivar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodigo || !formNombre) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const parentCuenta = formParentId
      ? cuentas.find((c) => c.id.toString() === formParentId)
      : null;
    const nivel = parentCuenta ? parentCuenta.nivel + 1 : 1;

    const data = {
      codigo: formCodigo,
      nombre: formNombre,
      tipo: formTipo,
      nivel,
      parentId: formParentId ? Number(formParentId) : null,
      imputable: formImputable,
      descripcion: formDescripcion || null,
    };

    try {
      if (editingCuenta) {
        await updateMutation.mutateAsync({ id: editingCuenta.id, data });
        toast.success('Cuenta contable actualizada');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Cuenta contable creada');
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

  // Parent options: same type, non-imputable (groups)
  const parentOptions = cuentas
    .filter((c) => c.tipo === formTipo && !c.imputable && c.id !== editingCuenta?.id)
    .map((c) => ({
      value: c.id.toString(),
      label: `${c.codigo} - ${c.nombre}`,
    }));

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<BookOpen className="h-5 w-5" />}
          breadcrumb={['Contabilidad', 'Plan de Cuentas']}
          title="Plan de Cuentas"
          subtitle={`${cuentas.length} cuentas contables`}
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

        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : cuentas.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6 text-brand" />}
            title="Sin cuentas contables"
            description="Configure su plan de cuentas para clasificar movimientos."
          />
        ) : (
          <>
            <div className="flex justify-end">
              <button
                onClick={expandAll}
                className="text-xs text-brand hover:underline font-medium"
              >
                Expandir todo
              </button>
            </div>
            <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 w-40">
                        Codigo
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                        Nombre
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden sm:table-cell w-28">
                        Tipo
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 text-center hidden lg:table-cell w-20">
                        Imputable
                      </th>
                      <th className="px-2 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right w-24">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.map((node) => (
                      <TreeRow
                        key={node.id}
                        node={node}
                        level={0}
                        expanded={expanded}
                        onToggle={toggleExpand}
                        onEdit={handleEdit}
                        onDeactivate={handleDeactivate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Drawer para crear/editar */}
        <DialogBase
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          type="drawer"
          maxWidth="md"
          title={editingCuenta ? 'Editar Cuenta Contable' : 'Nueva Cuenta Contable'}
          icon={
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="cuenta-contable-form"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCuenta ? 'Guardar Cambios' : 'Crear Cuenta'}
              </Button>
            </>
          }
        >
          <form id="cuenta-contable-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Codigo *"
                placeholder="5.1.01"
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value)}
              />
              <Select
                label="Tipo *"
                options={TIPOS.map((t) => ({
                  value: t,
                  label: TIPO_CUENTA_CONTABLE_CONFIG[t].label,
                }))}
                value={formTipo}
                onChange={(v) => {
                  setFormTipo(v as TipoCuentaContable);
                  setFormParentId(''); // reset parent on type change
                }}
              />
            </div>
            <Input
              label="Nombre *"
              placeholder="Materiales"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
            />
            <Select
              label="Cuenta Padre"
              options={parentOptions}
              value={formParentId}
              onChange={(v) => setFormParentId(v)}
              placeholder="Sin padre (rubro raiz)"
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="imputable"
                checked={formImputable}
                onChange={(e) => setFormImputable(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <label htmlFor="imputable" className="text-sm text-slate-700 dark:text-slate-300">
                Imputable (se pueden imputar movimientos)
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descripcion
              </label>
              <textarea
                rows={2}
                placeholder="Descripcion opcional..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none text-slate-900 dark:text-white transition-all"
              />
            </div>
          </form>
        </DialogBase>

        {ConfirmDialog}
      </div>
    </PullToRefresh>
  );
}
