import { create } from 'zustand';

interface HighlightState {
  highlightedTickets: Set<number>;
  highlightTicket: (id: number) => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  highlightedTickets: new Set(),
  highlightTicket: (id: number) => {
    set((state) => {
      const next = new Set(state.highlightedTickets);
      next.add(id);
      return { highlightedTickets: next };
    });

    // Auto-remove after 2s
    setTimeout(() => {
      set((state) => {
        const next = new Set(state.highlightedTickets);
        next.delete(id);
        return { highlightedTickets: next };
      });
    }, 2000);
  },
}));
