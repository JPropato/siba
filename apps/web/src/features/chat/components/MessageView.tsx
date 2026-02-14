import { useEffect, useRef, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useMessages, useSendMessage, useMarkAsRead } from '../hooks/useChat';
import { useChatStore } from '../stores/chat-store';
import { useAuthStore } from '../../../stores/auth-store';
import type { ChatMessage } from '../types';

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
  const [input, setInput] = useState('');
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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;

    sendMessage.mutate({ conversationId, contenido: trimmed }, { onSuccess: () => setInput('') });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
      <div className="shrink-0 border-t border-[var(--border)] px-3 py-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-brand/50 max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="p-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
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
        <p className="text-sm whitespace-pre-wrap break-words">{message.contenido}</p>
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
