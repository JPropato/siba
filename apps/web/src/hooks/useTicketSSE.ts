import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth-store';
import { useHighlightStore } from '../stores/highlight-store';

const API_URL =
  window.__RUNTIME_CONFIG__?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';

export function useTicketSSE() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const url = `${API_URL}/api/events?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('ticket:change', (event) => {
      try {
        const data = JSON.parse(event.data) as {
          action: string;
          ticketId: number;
          timestamp: number;
        };

        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        // Highlight the affected card
        useHighlightStore.getState().highlightTicket(data.ticketId);
      } catch {
        // Ignore malformed events
      }
    });

    es.onerror = () => {
      console.warn('[SSE] Connection error, will auto-reconnect');
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [accessToken, queryClient]);
}
