import { useState, useEffect, useCallback } from 'react';
import { Store, Plus, Pencil, Trash2, Search, Loader2, Phone, Mail } from 'lucide-react';
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
import type { Proveedor, CondicionIva, CreateProveedorDto } from '../types';
import { CONDICION_IVA_LABELS } from '../types';
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
} from '../hooks/useProveedores';

const CONDICION_IVA_OPTIONS = Object.entries(CONDICION_IVA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ProveedoresPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

  // Form state
  const [formRazonSocial, setFormRazonSocial] = useState('');
  const [formCuit, setFormCuit] = useState('');
  const [formCondicionIva, setFormCondicionIva] = useState<string>('RESPONSABLE_INSCRIPTO');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formContactoNombre, setFormContactoNombre] = useState('');
  const [formContactoTelefono, setFormContactoTelefono] = useState('');
  const [formNotas, setFormNotas] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch } = useProveedores({
    search: debouncedSearch,
    page,
    limit: 20,
  });
  const proveedores = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const deleteMutation = useDeleteProveedor();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const resetForm = () => {
    setFormRazonSocial('');
    setFormCuit('');
    setFormCondicionIva('RESPONSABLE_INSCRIPTO');
    setFormTelefono('');
    setFormEmail('');
    setFormDireccion('');
    setFormContactoNombre('');
    setFormContactoTelefono('');
    setFormNotas('');
  };

  const handleCreate = () => {
    setEditingProveedor(null);
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleEdit = (prov: Proveedor) => {
    setEditingProveedor(prov);
    setFormRazonSocial(prov.razonSocial);
    setFormCuit(prov.cuit);
    setFormCondicionIva(prov.condicionIva);
    setFormTelefono(prov.telefono || '');
    setFormEmail(prov.email || '');
    setFormDireccion(prov.direccion || '');
    setFormContactoNombre(prov.contactoNombre || '');
    setFormContactoTelefono(prov.contactoTelefono || '');
    setFormNotas(prov.notas || '');
    setIsDrawerOpen(true);
  };

  const handleDelete = async (prov: Proveedor) => {
    const ok = await confirm({
      title: 'Eliminar proveedor',
      message: `¿Eliminar "${prov.razonSocial}"? Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(prov.id);
      toast.success('Proveedor eliminado');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRazonSocial || !formCuit || !formCondicionIva) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const data: CreateProveedorDto = {
      razonSocial: formRazonSocial,
      cuit: formCuit,
      condicionIva: formCondicionIva as CondicionIva,
      telefono: formTelefono || null,
      email: formEmail || null,
      direccion: formDireccion || null,
      contactoNombre: formContactoNombre || null,
      contactoTelefono: formContactoTelefono || null,
      notas: formNotas || null,
    };

    try {
      if (editingProveedor) {
        await updateMutation.mutateAsync({ id: editingProveedor.id, data });
        toast.success('Proveedor actualizado');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Proveedor creado');
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

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Store className="h-5 w-5" />}
          breadcrumb={['Compras', 'Proveedores']}
          title="Proveedores"
          subtitle={`${data?.pagination?.total ?? 0} proveedores`}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </button>
          }
        />

        <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por razon social o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>
        </CollapsibleFilters>

        {isLoading ? (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="h-9 w-9 text-brand animate-spin" />
          </div>
        ) : proveedores.length === 0 ? (
          <EmptyState
            icon={<Store className="h-6 w-6 text-brand" />}
            title="Sin proveedores"
            description="Cree proveedores para registrar compras y facturas."
          />
        ) : (
          <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 w-16">
                      #
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                      Razon Social
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden md:table-cell">
                      CUIT
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden lg:table-cell">
                      Cond. IVA
                    </th>
                    <th className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 hidden xl:table-cell">
                      Contacto
                    </th>
                    <th className="px-2 py-2 font-semibold text-slate-900 dark:text-slate-100 text-right w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((prov) => (
                    <tr
                      key={prov.id}
                      className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-slate-400 font-mono">{prov.codigo}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {prov.razonSocial}
                          </span>
                          <span className="block text-[10px] text-slate-400 md:hidden">
                            {prov.cuit}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                          {prov.cuit}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {CONDICION_IVA_LABELS[prov.condicionIva]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 hidden xl:table-cell">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {prov.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {prov.telefono}
                            </span>
                          )}
                          {prov.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {prov.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(prov)}
                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prov)}
                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          icon={
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <Store className="h-5 w-5" />
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="proveedor-form"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
              </Button>
            </>
          }
        >
          <form id="proveedor-form" onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Razon Social *"
              placeholder="Materiales del Litoral SRL"
              value={formRazonSocial}
              onChange={(e) => setFormRazonSocial(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CUIT *"
                placeholder="30-71234567-8"
                value={formCuit}
                onChange={(e) => setFormCuit(e.target.value)}
              />
              <Select
                label="Condicion IVA *"
                options={CONDICION_IVA_OPTIONS}
                value={formCondicionIva}
                onChange={(v) => setFormCondicionIva(v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Telefono"
                placeholder="0342-4551234"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
              />
              <Input
                label="Email"
                placeholder="ventas@empresa.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <Input
              label="Direccion"
              placeholder="Ruta 11 km 3, Santa Fe"
              value={formDireccion}
              onChange={(e) => setFormDireccion(e.target.value)}
            />

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Contacto
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  placeholder="Juan Perez"
                  value={formContactoNombre}
                  onChange={(e) => setFormContactoNombre(e.target.value)}
                />
                <Input
                  label="Telefono"
                  placeholder="342-5001234"
                  value={formContactoTelefono}
                  onChange={(e) => setFormContactoTelefono(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Notas
              </label>
              <textarea
                rows={2}
                placeholder="Notas internas..."
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
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
