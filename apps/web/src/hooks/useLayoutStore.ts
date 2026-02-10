import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LayoutMode = 'sidebar' | 'topnav';

interface LayoutState {
  layout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layout: 'sidebar',
      setLayout: (layout) => set({ layout }),
    }),
    {
      name: 'siba-layout',
    }
  )
);
