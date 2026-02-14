import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth-store';
import { connectSocket, disconnectSocket } from '../lib/socket-client';
import { useChatStore } from '../stores/chat-store';
import type { ChatMessage } from '../types';

export function useChatSocket() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const updateUnreadCount = useChatStore((s) => s.updateUnreadCount);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connectSocket();

    const handleNewMessage = (message: ChatMessage) => {
      // Invalidate messages and conversations queries
      queryClient.invalidateQueries({ queryKey: ['chat-messages', message.conversacionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });

      // If message is not in the active conversation, increment unread
      if (message.conversacionId !== activeConversationId) {
        const currentCount = useChatStore.getState().unreadCounts[message.conversacionId] || 0;
        updateUnreadCount(message.conversacionId, currentCount + 1);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [isAuthenticated, accessToken, queryClient, activeConversationId, updateUnreadCount]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);
}
