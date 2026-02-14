import { X, ArrowLeft, Plus, Users } from 'lucide-react';
import { useChatStore } from '../stores/chat-store';
import { ConversationList } from './ConversationList';
import { MessageView } from './MessageView';
import { useState } from 'react';
import { NewConversationDialog } from './NewConversationDialog';
import { GroupInfoSheet } from './GroupInfoSheet';
import { useConversationDetail } from '../hooks/useChat';

export function ChatPanel() {
  const { panelOpen, closePanel, activeConversationId, setActiveConversation } = useChatStore();
  const [showNewConv, setShowNewConv] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const { data: conversation } = useConversationDetail(activeConversationId);

  if (!panelOpen) return null;

  const isGroupConversation = conversation?.tipo === 'GRUPAL';

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={closePanel} />

      <div className="fixed right-0 top-12 bottom-0 z-40 w-full sm:w-[380px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--border)] shrink-0">
          {activeConversationId ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => setActiveConversation(null)}
                className="p-1 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5 shrink-0"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {conversation?.nombre || 'Conversacion'}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Chat</h2>
          )}
          <div className="flex items-center gap-1">
            {activeConversationId && isGroupConversation && (
              <button
                onClick={() => setShowGroupInfo(true)}
                className="p-1.5 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5"
                title="Informacion del grupo"
              >
                <Users className="size-4" />
              </button>
            )}
            {!activeConversationId && (
              <button
                onClick={() => setShowNewConv(true)}
                className="p-1.5 text-[var(--muted)] hover:text-brand transition-colors rounded-md hover:bg-brand/5"
                title="Nueva conversacion"
              >
                <Plus className="size-4" />
              </button>
            )}
            <button
              onClick={closePanel}
              className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-md"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeConversationId ? (
            <MessageView conversationId={activeConversationId} />
          ) : (
            <ConversationList />
          )}
        </div>
      </div>

      {showNewConv && <NewConversationDialog onClose={() => setShowNewConv(false)} />}
      {showGroupInfo && activeConversationId && (
        <GroupInfoSheet
          conversationId={activeConversationId}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </>
  );
}
