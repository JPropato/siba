import { useState, useCallback } from 'react';

/**
 * Hook para anuncios accesibles con aria-live.
 *
 * Permite anunciar mensajes a screen readers de forma no intrusiva.
 *
 * @example
 * const { announce, message } = useLiveAnnounce();
 *
 * // En tu componente:
 * <LiveRegion message={message} />
 *
 * // Para anunciar:
 * announce('Ticket eliminado correctamente');
 */
export function useLiveAnnounce() {
  const [message, setMessage] = useState('');

  const announce = useCallback((text: string) => {
    // Clear first to ensure re-announcement of same message
    setMessage('');
    // Use setTimeout to ensure the clear happens before the new message
    setTimeout(() => setMessage(text), 100);
    // Auto-clear after announcement
    setTimeout(() => setMessage(''), 3000);
  }, []);

  return { announce, message };
}

export default useLiveAnnounce;
