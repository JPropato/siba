import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    roles: string[];
    permisos: string[];
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
            setToken: (token) => set({ accessToken: token }),

            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'siba-auth', // nombre clave en localStorage
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Token NO se persiste
        }
    )
);
