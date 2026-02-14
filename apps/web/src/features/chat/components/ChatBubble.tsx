import { MessageCircle } from 'lucide-react';
import { useChatStore } from '../stores/chat-store';
import { useUnreadCount } from '../hooks/useChat';
import { useEffect } from 'react';

export function ChatBubble() {
  const { panelOpen, togglePanel, totalUnread, setUnreadCounts } = useChatStore();
  const { data: unreadData } = useUnreadCount();

  useEffect(() => {
    if (unreadData) {
      const byConv: Record<number, number> = {};
      if (unreadData.byConversation) {
        for (const [k, v] of Object.entries(unreadData.byConversation)) {
          byConv[Number(k)] = v as number;
        }
      }
      setUnreadCounts(byConv);
    }
  }, [unreadData, setUnreadCounts]);

  return (
    <button
      onClick={togglePanel}
      className={`fixed right-6 bottom-6 z-50 flex items-center justify-center size-12 rounded-full shadow-lg transition-all duration-200 ${
        panelOpen ? 'bg-brand text-white scale-95' : 'bg-brand text-white hover:scale-105'
      }`}
      aria-label={panelOpen ? 'Cerrar chat' : 'Abrir chat'}
    >
      <MessageCircle className="size-5" />
      {totalUnread > 0 && !panelOpen && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </button>
  );
}
