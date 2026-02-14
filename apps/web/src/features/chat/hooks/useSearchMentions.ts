import { useState, useRef } from 'react';
import api from '../../../lib/api';

export interface MentionResult {
  id: number;
  type: string; // 'user' | 'ticket' | 'obra' | 'cliente' | 'vehiculo' | 'material'
  display: string;
  detail: string;
  mentionText: string;
}

export function useSearchMentions() {
  const [results, setResults] = useState<{ users: MentionResult[]; entities: MentionResult[] }>({
    users: [],
    entities: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = async (query: string, mentionType: '@' | '#') => {
    // Cancel previous request
    abortRef.current?.abort();

    if (query.length < 2) {
      setResults({ users: [], entities: [] });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    try {
      const type = mentionType === '@' ? 'user' : 'all';
      const res = await api.get('/chat/search-mentions', {
        params: { q: query, type },
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setResults(res.data?.data ?? { users: [], entities: [] });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err) {
        const error = err as { name: string };
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          setResults({ users: [], entities: [] });
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setResults({ users: [], entities: [] });
    setIsSearching(false);
  };

  return { results, isSearching, search, clear };
}
