import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import UserDialog from '../components/users/UserDialog';
import type { User } from '../types/user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users', {
        params: { search },
      });
      // La API devuelve { data: User[], meta: ... }
      if (res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]); // Reload when search changes

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) return;

    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers(); // Refresh
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleSave = async (data: {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    rolId: number;
  }) => {
    if (selectedUser) {
      // Update
      await api.put(`/users/${selectedUser.id}`, data);
    } else {
      // Create
      await api.post('/users', data);
    }
    fetchUsers(); // Refresh list
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre el acceso y roles del personal.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          NUEVO USUARIO
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />

      {/* Dialog */}
      <UserDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedUser}
      />
    </div>
  );
}
