import { useState } from 'react';
import { X, Search, MessageCircle, Users } from 'lucide-react';
import { useCreateConversation } from '../hooks/useChat';
import { useChatStore } from '../stores/chat-store';
import api from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth-store';

interface UserResult {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

interface Props {
  onClose: () => void;
  onConversationCreated?: (conversationId: number) => void;
}

type Mode = 'directa' | 'grupal';

export function NewConversationDialog({ onClose, onConversationCreated }: Props) {
  const [mode, setMode] = useState<Mode>('directa');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const createConv = useCreateConversation();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const currentUser = useAuthStore((s) => s.user);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users', { params: { search: query, limit: 10 } });
      const users = (res.data?.data ?? []) as UserResult[];
      // Filter out current user and already selected
      const filtered = users.filter(
        (u) => u.id !== currentUser?.id && !selectedUsers.find((s) => s.id === u.id)
      );
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: UserResult) => {
    if (mode === 'directa') {
      // Create direct conversation
      createConv.mutate(
        { tipo: 'DIRECTA', participantIds: [user.id] },
        {
          onSuccess: (conv) => {
            if (onConversationCreated) {
              onConversationCreated(conv.id);
            } else {
              setActiveConversation(conv.id);
            }
            onClose();
          },
        }
      );
    } else {
      // Add to selected users
      setSelectedUsers((prev) => [...prev, user]);
      setSearch('');
      setResults([]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    createConv.mutate(
      {
        tipo: 'GRUPAL',
        nombre: groupName.trim(),
        participantIds: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: (conv) => {
          if (onConversationCreated) {
            onConversationCreated(conv.id);
          } else {
            setActiveConversation(conv.id);
          }
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--surface)] rounded-xl shadow-2xl w-full max-w-sm mx-4 border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Nueva conversacion</h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2">
          <button
            onClick={() => {
              setMode('directa');
              setSelectedUsers([]);
              setGroupName('');
              setSearch('');
              setResults([]);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'directa'
                ? 'bg-brand/10 text-brand'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <MessageCircle className="size-3.5" />
            Directa
          </button>
          <button
            onClick={() => {
              setMode('grupal');
              setSearch('');
              setResults([]);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              mode === 'grupal'
                ? 'bg-brand/10 text-brand'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <Users className="size-3.5" />
            Grupal
          </button>
        </div>

        {/* Group name (only in grupal mode) */}
        {mode === 'grupal' && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Nombre del grupo *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Equipo de desarrollo"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
          </div>
        )}

        {/* Selected users chips (only in grupal mode) */}
        {mode === 'grupal' && selectedUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Participantes ({selectedUsers.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand/10 text-brand"
                >
                  {user.nombre} {user.apellido}
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="hover:text-brand/70 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3">
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            {mode === 'directa' ? 'Buscar usuario' : 'Agregar participante'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar usuario..."
              autoFocus={mode === 'directa'}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
          {searching && <div className="px-4 py-3 text-xs text-[var(--muted)]">Buscando...</div>}
          {!searching && results.length === 0 && search.length >= 2 && (
            <div className="px-4 py-3 text-xs text-[var(--muted)]">No se encontraron usuarios</div>
          )}
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              disabled={createConv.isPending}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--background)] transition-colors text-left"
            >
              <div className="size-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <MessageCircle className="size-3.5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-[10px] text-[var(--muted)]">{user.email}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer - Create group button (only in grupal mode) */}
        {mode === 'grupal' && (
          <div className="px-4 py-3 border-t border-[var(--border)]">
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || createConv.isPending}
              className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createConv.isPending ? 'Creando...' : 'Crear grupo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
