import { useState, useCallback, useMemo } from 'react';
import { Building2, Plus, Pencil, Power, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PullToRefresh } from '../../../components/ui/PullToRefresh';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useConfirm } from '../../../hooks/useConfirm';
import { DialogBase } from '../../../components/ui/core/DialogBase';
import { Input } from '../../../components/ui/core/Input';
import { Select } from '../../../components/ui/core/Select';
import { Button } from '../../../components/ui/core/Button';
import type { CentroCosto } from '../types';
import {
  useCentrosCosto,
  useCreateCentroCosto,
  useUpdateCentroCosto,
  useDeleteCentroCosto,
} from '../hooks/useCentrosCosto';

interface TreeNode extends CentroCosto {
  children: TreeNode[];
}

function buildTree(centros: CentroCosto[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const c of centros) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const c of centros) {
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
  onEdit: (c: CentroCosto) => void;
  onDeactivate: (c: CentroCosto) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr
        className={`border-b border-slate-100 dark:border-slate-800 ${
          hasChildren ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-950'
        } hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors`}
      >
        <td className="px-3 py-2.5">
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
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
              {node.codigo}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`text-sm ${
              hasChildren
                ? 'text-slate-700 dark:text-slate-300 font-semibold'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {node.nombre}
          </span>
          {node.descripcion && (
            <p className="text-[10px] text-slate-400 mt-0.5">{node.descripcion}</p>
          )}
        </td>
        <td className="px-2 py-2.5 text-right">
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

export default function CentrosCostoPage() {
  const { data: centros = [], isLoading, refetch } = useCentrosCosto();
  const createMutation = useCreateCentroCosto();
  const updateMutation = useUpdateCentroCosto();
  const deleteMutation = useDeleteCentroCosto();
  const { confirm, ConfirmDialog } = useConfirm();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCosto | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  const tree = useMemo(() => buildTree(centros), [centros]);

  // Expand all parents by default
  useState(() => {
    const parentIds = new Set(centros.filter((c) => c.parentId).map((c) => c.parentId));
    if (parentIds.size > 0 && expanded.size === 0) {
      setExpanded(parentIds as Set<number>);
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

  const handleCreate = () => {
    setEditingCentro(null);
    setFormCodigo('');
    setFormNombre('');
    setFormParentId('');
    setFormDescripcion('');
    setIsDrawerOpen(true);
  };

  const handleEdit = (centro: CentroCosto) => {
    setEditingCentro(centro);
    setFormCodigo(centro.codigo);
    setFormNombre(centro.nombre);
    setFormParentId(centro.parentId?.toString() || '');
    setFormDescripcion(centro.descripcion || '');
    setIsDrawerOpen(true);
  };

  const handleDeactivate = async (centro: CentroCosto) => {
    const confirmed = await confirm({
      title: 'Desactivar centro de costo',
      message: `¿Desactivar "${centro.codigo} - ${centro.nombre}"?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(centro.id);
      toast.success('Centro de costo desactivado');
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

    const data = {
      codigo: formCodigo,
      nombre: formNombre,
      parentId: formParentId ? Number(formParentId) : null,
      descripcion: formDescripcion || null,
    };

    try {
      if (editingCentro) {
        await updateMutation.mutateAsync({ id: editingCentro.id, data });
        toast.success('Centro de costo actualizado');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Centro de costo creado');
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

  // Parent options: centros that have no parent (top-level) or are already parents
  const parentOptions = centros
    .filter((c) => c.id !== editingCentro?.id)
    .map((c) => ({
      value: c.id.toString(),
      label: `${c.codigo} - ${c.nombre}`,
    }));

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Building2 className="h-5 w-5" />}
          breadcrumb={['Contabilidad', 'Centros de Costo']}
          title="Centros de Costo"
          subtitle={`${centros.length} centros de costo`}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo Centro
            </button>
          }
        />

        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : centros.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6 text-brand" />}
            title="Sin centros de costo"
            description="Cree centros de costo para clasificar movimientos por area."
          />
        ) : (
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
        )}

        {/* Drawer para crear/editar */}
        <DialogBase
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          type="drawer"
          maxWidth="md"
          title={editingCentro ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
          icon={
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="centro-costo-form"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCentro ? 'Guardar Cambios' : 'Crear Centro'}
              </Button>
            </>
          }
        >
          <form id="centro-costo-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Codigo *"
                placeholder="OP.ZN"
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value)}
              />
              <Input
                label="Nombre *"
                placeholder="Zona Norte"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <Select
              label="Centro Padre"
              options={parentOptions}
              value={formParentId}
              onChange={(v) => setFormParentId(v)}
              placeholder="Sin padre (raiz)"
            />
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
