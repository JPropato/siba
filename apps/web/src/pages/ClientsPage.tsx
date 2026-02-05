import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search } from 'lucide-react';
import ClientTable from '../components/clients/ClientTable';
import ClientDialog from '../components/clients/ClientDialog';
import type { Cliente, ClienteFormData } from '../types/client';

export default function ClientsPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/clients', {
        params: {
          search: search || undefined,
        },
      });
      if (res.data && res.data.data) {
        setClients(res.data.data);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Cliente) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (client: Cliente) => {
    if (!window.confirm(`¿Está seguro de eliminar a "${client.razonSocial}"?`)) return;

    try {
      await api.delete(`/clients/${client.id}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar cliente');
    }
  };

  const handleSave = async (data: ClienteFormData) => {
    if (selectedClient) {
      await api.put(`/clients/${selectedClient.id}`, data);
    } else {
      await api.post('/clients', data);
    }
    fetchClients();
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Page Header - Aligned with UsersPage */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre la base centralizada de clientes y sus configuraciones.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          NUEVO CLIENTE
        </button>
      </div>

      {/* Filters - Aligned with UsersPage */}
      <div className="flex gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
      </div>

      {/* Table */}
      <ClientTable
        clients={clients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Dialog */}
      <ClientDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedClient}
      />
    </div>
  );
}
