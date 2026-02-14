import { useEffect, useRef } from 'react';
import { useMessages, useSendMessage, useMarkAsRead } from '../hooks/useChat';
import { useChatStore } from '../stores/chat-store';
import { useAuthStore } from '../../../stores/auth-store';
import type { ChatMessage } from '../types';
import { MessageInput } from './MessageInput';
import { parseMentions } from '../lib/parse-mentions';

interface Props {
  conversationId: number;
}

export function MessageView({ conversationId }: Props) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const sendMessage = useSendMessage();
  const { mutate: markRead } = useMarkAsRead();
  const currentUser = useAuthStore((s) => s.user);
  const decrementUnread = useChatStore((s) => s.decrementUnread);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Mark as read when entering conversation
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  useEffect(() => {
    markReadRef.current(conversationId);
    decrementUnread(conversationId);
  }, [conversationId, decrementUnread]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.pages?.[0]?.messages?.length]);

  // Load more on scroll to top
  const handleScroll = () => {
    if (!listRef.current || !hasNextPage || isFetchingNextPage) return;
    if (listRef.current.scrollTop === 0) {
      fetchNextPage();
    }
  };

  const handleSend = (
    contenido: string,
    menciones: { entidadTipo: string; entidadId: number; textoDisplay: string }[]
  ) => {
    if (sendMessage.isPending) return;
    sendMessage.mutate({ conversationId, contenido, menciones });
  };

  // Flatten all pages' messages and reverse to show oldest first
  const allMessages = data?.pages?.flatMap((p) => p.messages).reverse() ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 custom-scrollbar"
      >
        {isFetchingNextPage && (
          <div className="text-center py-2">
            <span className="text-xs text-[var(--muted)]">Cargando anteriores...</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3" />
              </div>
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--muted)]">Envia el primer mensaje</p>
          </div>
        ) : (
          allMessages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.autorId === currentUser?.id}
              showAuthor={idx === 0 || allMessages[idx - 1].autorId !== msg.autorId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <MessageInput onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  showAuthor,
}: {
  message: ChatMessage;
  isOwn: boolean;
  showAuthor: boolean;
}) {
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAuthor ? 'mt-3' : 'mt-0.5'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-1.5 ${
          isOwn
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-sm'
        }`}
      >
        {showAuthor && !isOwn && (
          <p className="text-[10px] font-semibold text-brand mb-0.5">
            {message.autor.nombre} {message.autor.apellido}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {parseMentions(message.contenido)}
        </p>
        <p
          className={`text-[9px] mt-0.5 text-right ${isOwn ? 'text-white/60' : 'text-[var(--muted)]'}`}
        >
          {new Date(message.fechaCreacion).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
