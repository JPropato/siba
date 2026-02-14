import { useState } from 'react';
import { X, Search, MessageCircle } from 'lucide-react';
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
}

export function NewConversationDialog({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
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
      // Filter out current user
      setResults(users.filter((u) => u.id !== currentUser?.id));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: UserResult) => {
    createConv.mutate(
      { tipo: 'DIRECTA', participantIds: [user.id] },
      {
        onSuccess: (conv) => {
          setActiveConversation(conv.id);
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

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar usuario..."
              autoFocus
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
      </div>
    </div>
  );
}
