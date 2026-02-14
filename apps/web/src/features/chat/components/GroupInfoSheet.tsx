import { useState } from 'react';
import { X, Edit3, Check, UserPlus, UserMinus, Users, Crown } from 'lucide-react';
import {
  useConversationDetail,
  useUpdateConversation,
  useAddParticipants,
  useRemoveParticipant,
} from '../hooks/useChat';
import { useAuthStore } from '../../../stores/auth-store';
import api from '../../../lib/api';
import { toast } from 'sonner';

interface Props {
  conversationId: number;
  onClose: () => void;
}

interface UserResult {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export function GroupInfoSheet({ conversationId, onClose }: Props) {
  const { data: conversation, isLoading } = useConversationDetail(conversationId);
  const updateConv = useUpdateConversation();
  const addParticipants = useAddParticipants();
  const removeParticipant = useRemoveParticipant();
  const currentUser = useAuthStore((s) => s.user);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const currentParticipant = conversation?.participantes.find(
    (p) => p.usuarioId === currentUser?.id
  );
  const isAdmin = currentParticipant?.rol === 'ADMIN';
  const adminCount = conversation?.participantes.filter((p) => p.rol === 'ADMIN').length ?? 0;

  const handleStartEdit = () => {
    setEditedName(conversation?.nombre ?? '');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (!editedName.trim() || editedName === conversation?.nombre) {
      setIsEditingName(false);
      return;
    }
    updateConv.mutate(
      { id: conversationId, data: { nombre: editedName.trim() } },
      {
        onSuccess: () => {
          toast.success('Nombre actualizado');
          setIsEditingName(false);
        },
        onError: () => {
          toast.error('Error al actualizar nombre');
        },
      }
    );
  };

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users', { params: { search: query, limit: 10 } });
      const users = (res.data?.data ?? []) as UserResult[];
      // Filter out current participants
      const participantIds = new Set(conversation?.participantes.map((p) => p.usuarioId) ?? []);
      setSearchResults(users.filter((u) => !participantIds.has(u.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = (userId: number) => {
    addParticipants.mutate(
      { conversationId, participantIds: [userId] },
      {
        onSuccess: () => {
          toast.success('Participante agregado');
          setIsAddingMember(false);
          setSearch('');
          setSearchResults([]);
        },
        onError: () => {
          toast.error('Error al agregar participante');
        },
      }
    );
  };

  const handleRemoveMember = (userId: number, userName: string) => {
    if (!window.confirm(`¿Remover a ${userName} del grupo?`)) return;
    removeParticipant.mutate(
      { conversationId, userId },
      {
        onSuccess: () => {
          toast.success('Participante removido');
        },
        onError: () => {
          toast.error('Error al remover participante');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="fixed right-0 top-12 bottom-0 z-50 w-full sm:w-[320px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex items-center justify-center">
        <div className="text-sm text-[var(--muted)]">Cargando...</div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed right-0 top-12 bottom-0 z-50 w-full sm:w-[320px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Informacion del grupo</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-md"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Group icon */}
          <div className="flex justify-center py-6 border-b border-[var(--border)]">
            <div className="size-20 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center">
              <Users className="size-10 text-brand" />
            </div>
          </div>

          {/* Group name */}
          <div className="px-4 py-4 border-b border-[var(--border)]">
            {isEditingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-brand/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={updateConv.isPending}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="size-3.5 inline mr-1" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted)] mb-0.5">Nombre del grupo</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {conversation.nombre}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Participants section */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Participantes ({conversation.participantes.length})
              </p>
              {isAdmin && !isAddingMember && (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="p-1 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5"
                  title="Agregar participante"
                >
                  <UserPlus className="size-3.5" />
                </button>
              )}
            </div>

            {/* Add member search */}
            {isAddingMember && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar usuario..."
                  autoFocus
                  className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-brand/50"
                />
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {searching && <div className="text-xs text-[var(--muted)] py-2">Buscando...</div>}
                  {!searching && searchResults.length === 0 && search.length >= 2 && (
                    <div className="text-xs text-[var(--muted)] py-2">
                      No se encontraron usuarios
                    </div>
                  )}
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      disabled={addParticipants.isPending}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface)] transition-colors text-left"
                    >
                      <div className="size-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-brand">
                          {user.nombre[0]}
                          {user.apellido[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">
                          {user.nombre} {user.apellido}
                        </p>
                        <p className="text-[10px] text-[var(--muted)] truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setSearch('');
                    setSearchResults([]);
                  }}
                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Participants list */}
            <div className="space-y-2">
              {conversation.participantes.map((participant) => {
                const canRemove =
                  isAdmin &&
                  participant.usuarioId !== currentUser?.id &&
                  !(participant.rol === 'ADMIN' && adminCount === 1);

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background)] transition-colors"
                  >
                    <div className="size-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                      <span className="text-xs font-semibold text-brand">
                        {participant.usuario.nombre[0]}
                        {participant.usuario.apellido[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {participant.usuario.nombre} {participant.usuario.apellido}
                        </p>
                        {participant.rol === 'ADMIN' && (
                          <span title="Administrador">
                            <Crown className="size-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--muted)] truncate">
                        {participant.usuario.email}
                      </p>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() =>
                          handleRemoveMember(
                            participant.usuarioId,
                            `${participant.usuario.nombre} ${participant.usuario.apellido}`
                          )
                        }
                        disabled={removeParticipant.isPending}
                        className="p-1 text-[var(--muted)] hover:text-red-500 transition-colors rounded-md hover:bg-red-500/5"
                        title="Remover"
                      >
                        <UserMinus className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
