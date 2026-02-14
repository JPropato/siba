import { create } from 'zustand';

interface ChatState {
  panelOpen: boolean;
  activeConversationId: number | null;
  unreadCounts: Record<number, number>;
  totalUnread: number;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveConversation: (id: number | null) => void;
  setUnreadCounts: (counts: Record<number, number>) => void;
  updateUnreadCount: (conversationId: number, count: number) => void;
  decrementUnread: (conversationId: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  panelOpen: false,
  activeConversationId: null,
  unreadCounts: {},
  totalUnread: 0,

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false, activeConversationId: null }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setUnreadCounts: (counts) => {
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    set({ unreadCounts: counts, totalUnread: total });
  },

  updateUnreadCount: (conversationId, count) => {
    const counts = { ...get().unreadCounts, [conversationId]: count };
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    set({ unreadCounts: counts, totalUnread: total });
  },

  decrementUnread: (conversationId) => {
    const current = get().unreadCounts[conversationId] || 0;
    if (current <= 0) return;
    const counts = { ...get().unreadCounts, [conversationId]: 0 };
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    set({ unreadCounts: counts, totalUnread: total });
  },
}));
