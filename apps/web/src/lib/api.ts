import axios from 'axios';
import { useAuthStore } from '../stores/auth-store';

// Runtime config (generado por docker-entrypoint.sh) o fallback a env/localhost
declare global {
    interface Window {
        __RUNTIME_CONFIG__?: {
            VITE_API_URL?: string;
        };
    }
}

const API_URL = window.__RUNTIME_CONFIG__?.VITE_API_URL
    || import.meta.env.VITE_API_URL
    || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Importante para enviar Cookies en requests
});

// Interceptor de Request: Adjuntar Token
api.interceptors.request.use((config) => {
    // El token generalmente se almacena en memoria o se podría recuperar aqui si lo guardaramos en localStorage (no recomendado por seguridad)
    // En este diseño, confiamos en la cookie httpOnly para refresh y el accessToken en memoria (store)
    // Pero axios necesita el accessToken en header.

    // Como Zustand persiste en localStorage (solo user data, no token sensible por defecto, aunque nuestra implementacion actual solo persiste user/bool),
    // necesitamos un mecanismo para obtener el accessToken.

    // CORRECCIÓN: El store debe manejar el token en memoria.
    // Vamos a asumir que el store tiene un metodo getState para obtener el token si lo tuvieramos ahi.
    // Pero por seguridad dijimos "Access Token (vida corta)".

    // SOLUCIÓN SIMPLE: Guardar accessToken en memoria (variable local o en el store pero sin persistir).
    // Modificaré el auth-store para tener accessToken no persistido.
    const token = useAuthStore.getState().accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de Response: Manejar 401 (Token vencido)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Si error es 401 y no es un retry y NO es la ruta de login ni refresh
        const isAuthPath = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
            originalRequest._retry = true;

            try {
                // Intentar refresh
                const { data } = await axios.post(
                    `${API_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Actualizar token en store
                useAuthStore.getState().setToken(data.accessToken);

                // Actualizar header y reintentar
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Si falla el refresh, logout
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
