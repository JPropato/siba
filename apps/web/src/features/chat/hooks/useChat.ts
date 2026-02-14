import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import type { ChatConversation, ChatMessage } from '../types';

const CONVERSATIONS_KEY = ['chat-conversations'];
const MESSAGES_KEY = ['chat-messages'];
const UNREAD_KEY = ['chat-unread'];

// List conversations
export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return (res.data?.data ?? []) as ChatConversation[];
    },
    refetchInterval: 30000, // Refetch every 30s as fallback
  });
}

// Get messages for a conversation (infinite scroll)
export function useMessages(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: [...MESSAGES_KEY, conversationId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 50 };
      if (pageParam) params.cursor = pageParam;
      const res = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
      return {
        messages: (res.data?.data ?? []) as ChatMessage[],
        nextCursor: res.data?.meta?.nextCursor as number | null,
        hasMore: res.data?.meta?.hasMore as boolean,
      };
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!conversationId,
  });
}

// Get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => {
      const res = await api.get('/chat/unread-count');
      return res.data?.data as { total: number; byConversation: Record<string, number> };
    },
    refetchInterval: 30000,
  });
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      contenido,
      menciones,
    }: {
      conversationId: number;
      contenido: string;
      menciones?: { entidadTipo: string; entidadId: number; textoDisplay: string }[];
    }) => {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
        contenido,
        menciones: menciones?.length ? menciones : undefined,
      });
      return res.data?.data as ChatMessage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

// Create conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tipo: 'DIRECTA' | 'GRUPAL';
      nombre?: string;
      participantIds: number[];
    }) => {
      const res = await api.post('/chat/conversations', data);
      return res.data?.data as ChatConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

// Mark as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: number) => {
      await api.post(`/chat/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

// Get conversation detail
export function useConversationDetail(conversationId: number | null) {
  return useQuery({
    queryKey: ['chat-conversation-detail', conversationId],
    queryFn: async () => {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      return res.data?.data as ChatConversation;
    },
    enabled: !!conversationId,
  });
}

// Update conversation (group name/description)
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { nombre?: string; descripcion?: string };
    }) => {
      const res = await api.patch(`/chat/conversations/${id}`, data);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

// Add participants to group
export function useAddParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      participantIds,
    }: {
      conversationId: number;
      participantIds: number[];
    }) => {
      const res = await api.post(`/chat/conversations/${conversationId}/participants`, {
        participantIds,
      });
      return res.data?.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: ['chat-conversation-detail', vars.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, vars.conversationId] });
    },
  });
}

// Remove participant from group
export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: number; userId: number }) => {
      await api.delete(`/chat/conversations/${conversationId}/participants/${userId}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: ['chat-conversation-detail', vars.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, vars.conversationId] });
    },
  });
}
