import { memo } from 'react';

interface LiveRegionProps {
  message: string;
  /**
   * 'polite' - Waits for user to finish current task (default)
   * 'assertive' - Interrupts immediately (use sparingly)
   */
  priority?: 'polite' | 'assertive';
}

/**
 * LiveRegion - Región accesible para anuncios dinámicos.
 *
 * Los screen readers anunciarán cualquier cambio en el mensaje.
 * El componente es visualmente oculto pero accesible.
 *
 * @example
 * const { announce, message } = useLiveAnnounce();
 *
 * return (
 *   <>
 *     <LiveRegion message={message} />
 *     <button onClick={() => announce('Acción completada')}>
 *       Hacer algo
 *     </button>
 *   </>
 * );
 */
export const LiveRegion = memo(function LiveRegion({
  message,
  priority = 'polite',
}: LiveRegionProps) {
  return (
    <div role="status" aria-live={priority} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
});

export default LiveRegion;
