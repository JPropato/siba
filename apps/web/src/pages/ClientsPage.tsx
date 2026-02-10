import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Search, Plus, Building2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import ClientTable from '../components/clients/ClientTable';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../hooks/api/useClients';

// Lazy loading del dialog (solo se carga cuando se abre)
const ClientDialog = lazy(() => import('../components/clients/ClientDialog'));
import { FloatingActionButton } from '../components/layout/FloatingActionButton';
import { CollapsibleFilters } from '../components/layout/CollapsibleFilters';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import type { Cliente, ClienteFormData } from '../types/client';
import { Pagination } from '../components/ui/Pagination';
import { useConfirm } from '../hooks/useConfirm';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // TanStack Query hooks
  const { data, isLoading, refetch } = useClients(debouncedSearch, page);
  const clients = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Cliente) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (client: Cliente) => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      message: `¿Está seguro de eliminar a "${client.razonSocial}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteClient.mutateAsync(client.id);
      toast.success('Cliente eliminado');
    } catch {
      toast.error('Error al eliminar cliente');
    }
  };

  const handleSave = async (data: ClienteFormData) => {
    if (selectedClient) {
      await updateClient.mutateAsync({ id: selectedClient.id, data });
    } else {
      await createClient.mutateAsync(data);
    }
  };

  // Handler para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="px-4 pt-3 pb-6 sm:px-6 space-y-5 animate-in fade-in duration-500">
        <PageHeader
          icon={<Building2 className="h-5 w-5" />}
          breadcrumb={['Gestión', 'Clientes']}
          title="Clientes"
          subtitle="Base centralizada de clientes"
          count={clients.length}
          action={
            <button
              onClick={handleCreate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          }
        />

        {/* Filters - Colapsables en móvil */}
        <CollapsibleFilters activeFiltersCount={search ? 1 : 0}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Razón Social o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>
        </CollapsibleFilters>

        {/* Table */}
        <ClientTable
          clients={clients}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Dialog - Lazy loaded */}
        {isModalOpen && (
          <Suspense fallback={null}>
            <ClientDialog
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSave}
              initialData={selectedClient}
            />
          </Suspense>
        )}

        {ConfirmDialog}

        {/* FAB para móvil */}
        <FloatingActionButton
          onClick={handleCreate}
          icon={<Plus className="h-6 w-6" />}
          hideOnDesktop
          aria-label="Nuevo Cliente"
        />
      </div>
    </PullToRefresh>
  );
}
