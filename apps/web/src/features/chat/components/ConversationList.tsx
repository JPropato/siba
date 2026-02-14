import { useConversations } from '../hooks/useChat';
import { useChatStore } from '../stores/chat-store';
import { useAuthStore } from '../../../stores/auth-store';
import { Users, User } from 'lucide-react';

export function ConversationList() {
  const { data: conversations, isLoading } = useConversations();
  const { setActiveConversation, unreadCounts } = useChatStore();
  const currentUser = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Users className="size-12 text-[var(--muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--foreground)]">Sin conversaciones</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Inicia una nueva conversacion con el boton +
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full custom-scrollbar">
      {conversations.map((conv) => {
        const unread = unreadCounts[conv.id] || 0;

        // For direct conversations, show the other person's name
        const otherParticipant =
          conv.tipo === 'DIRECTA'
            ? conv.participantes.find((p) => p.usuarioId !== currentUser?.id)?.usuario
            : null;

        const displayName =
          conv.tipo === 'DIRECTA'
            ? otherParticipant
              ? `${otherParticipant.nombre} ${otherParticipant.apellido}`
              : 'Conversacion'
            : conv.nombre || 'Grupo';

        const lastMsg = conv.ultimoMensaje;
        const lastMsgPreview = lastMsg
          ? `${lastMsg.autor.nombre}: ${lastMsg.contenido.substring(0, 50)}${lastMsg.contenido.length > 50 ? '...' : ''}`
          : 'Sin mensajes aun';

        return (
          <button
            key={conv.id}
            onClick={() => setActiveConversation(conv.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)]/50"
          >
            {/* Avatar */}
            <div className="size-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
              {conv.tipo === 'DIRECTA' ? (
                <User className="size-4 text-brand" />
              ) : (
                <Users className="size-4 text-brand" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)] truncate">
                  {displayName}
                </span>
                {conv.ultimoMensajeAt && (
                  <span className="text-[10px] text-[var(--muted)] shrink-0 ml-2">
                    {formatTime(conv.ultimoMensajeAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[var(--muted)] truncate">{lastMsgPreview}</p>
                {unread > 0 && (
                  <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold bg-brand text-white rounded-full shrink-0 ml-2">
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48) {
    return 'Ayer';
  }
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
