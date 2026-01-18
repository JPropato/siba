import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeColor = 'gold' | 'blue' | 'emerald' | 'violet' | 'rose' | 'charcoal';

interface ThemeState {
    color: ThemeColor;
    setColor: (color: ThemeColor) => void;
}

const colors: Record<ThemeColor, { primary: string; light: string; dark: string }> = {
    gold: { primary: '#bd8e3d', light: '#e6c489', dark: '#9c7532' },
    blue: { primary: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    emerald: { primary: '#10b981', light: '#34d399', dark: '#059669' },
    violet: { primary: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
    rose: { primary: '#f43f5e', light: '#fb7185', dark: '#e11d48' },
    charcoal: { primary: '#334155', light: '#475569', dark: '#1e293b' },
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            color: 'gold',
            setColor: (color) => set({ color }),
        }),
        {
            name: 'siba-theme',
        }
    )
);

export const useThemeEffect = () => {
    const color = useThemeStore((state) => state.color);

    useEffect(() => {
        const root = document.documentElement;
        const theme = colors[color];

        root.style.setProperty('--brand-color', theme.primary);
        root.style.setProperty('--brand-light', theme.light);
        root.style.setProperty('--brand-dark', theme.dark);
    }, [color]);
};
