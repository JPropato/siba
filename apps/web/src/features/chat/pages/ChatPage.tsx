import { useState } from 'react';
import { MessageSquare, Plus, ArrowLeft } from 'lucide-react';
import { ConversationList } from '../components/ConversationList';
import { MessageView } from '../components/MessageView';
import { NewConversationDialog } from '../components/NewConversationDialog';
import { useConversations } from '../hooks/useChat';
import { useAuthStore } from '../../../stores/auth-store';

export function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const { data: conversations } = useConversations();
  const currentUser = useAuthStore((s) => s.user);

  const selectedConversation = conversations?.find((c) => c.id === selectedConversationId);

  const getConversationDisplayName = () => {
    if (!selectedConversation) return '';
    if (selectedConversation.tipo === 'DIRECTA') {
      const otherParticipant = selectedConversation.participantes.find(
        (p) => p.usuarioId !== currentUser?.id
      )?.usuario;
      return otherParticipant
        ? `${otherParticipant.nombre} ${otherParticipant.apellido}`
        : 'Conversacion';
    }
    return selectedConversation.nombre || 'Grupo';
  };

  const handleNewConversationCreated = (conversationId: number) => {
    setShowNewConv(false);
    setSelectedConversationId(conversationId);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-[var(--background)]">
      {/* Header - visible on mobile when no conversation is selected, always visible on desktop */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0 ${
          selectedConversationId ? 'lg:flex hidden' : 'flex'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
            <MessageSquare className="size-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">Chat</h1>
            <p className="text-xs text-[var(--muted)]">Mensajeria interna del equipo</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewConv(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation List */}
        <div
          className={`w-full lg:w-80 lg:border-r border-[var(--border)] bg-[var(--surface)] flex flex-col ${
            selectedConversationId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Mobile header when list is visible */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Conversaciones</h2>
            <button
              onClick={() => setShowNewConv(true)}
              className="p-1.5 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5"
              title="Nueva conversacion"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ConversationList
              onSelect={setSelectedConversationId}
              selectedId={selectedConversationId || undefined}
            />
          </div>
        </div>

        {/* Message Area */}
        <div
          className={`flex-1 flex flex-col ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}
        >
          {selectedConversationId ? (
            <>
              {/* Mobile back button header */}
              <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="p-1.5 text-[var(--muted)] hover:text-brand transition-colors rounded-md"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {getConversationDisplayName()}
                  </p>
                </div>
              </div>
              <MessageView conversationId={selectedConversationId} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-[var(--surface)]">
              <MessageSquare className="size-16 text-[var(--muted)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Bienvenido al Chat
              </h3>
              <p className="text-sm text-[var(--muted)] max-w-md">
                Selecciona una conversacion de la lista o crea una nueva para comenzar a chatear con
                tus companeros de equipo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      {showNewConv && (
        <NewConversationDialog
          onClose={() => setShowNewConv(false)}
          onConversationCreated={handleNewConversationCreated}
        />
      )}
    </div>
  );
}
