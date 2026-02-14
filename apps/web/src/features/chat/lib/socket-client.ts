import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../../stores/auth-store';

const API_URL =
  window.__RUNTIME_CONFIG__?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;
    socket = io(`${API_URL}/chat`, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    // Update token before connecting (might have been refreshed)
    const token = useAuthStore.getState().accessToken;
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
