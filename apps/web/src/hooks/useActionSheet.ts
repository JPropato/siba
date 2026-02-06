import { useState, useCallback, useRef } from 'react';

const LONG_PRESS_DELAY = 500;

/**
 * Hook para gestionar un ActionSheet mobile con long-press.
 *
 * @example
 * const { isOpen, selectedItem, close, getLongPressHandlers } = useActionSheet<Cliente>();
 *
 * // En cada fila:
 * <tr {...getLongPressHandlers(item)}>...</tr>
 *
 * // ActionSheet:
 * <MobileActionSheet open={isOpen} onClose={close} actions={[...]} />
 */
export function useActionSheet<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const preventClickRef = useRef(false);

  const open = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const getLongPressHandlers = useCallback(
    (item: T) => ({
      onTouchStart: (e: React.TouchEvent) => {
        preventClickRef.current = false;
        startPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        timerRef.current = setTimeout(() => {
          preventClickRef.current = true;
          if (navigator.vibrate) navigator.vibrate(30);
          open(item);
        }, LONG_PRESS_DELAY);
      },
      onTouchMove: (e: React.TouchEvent) => {
        const dx = Math.abs(e.touches[0].clientX - startPosRef.current.x);
        const dy = Math.abs(e.touches[0].clientY - startPosRef.current.y);
        if (dx > 10 || dy > 10) clearTimer();
      },
      onTouchEnd: clearTimer,
    }),
    [open, clearTimer]
  );

  /** Devuelve true si el último gesto fue long-press (para suprimir onClick). */
  const shouldPreventClick = useCallback(() => {
    if (preventClickRef.current) {
      preventClickRef.current = false;
      return true;
    }
    return false;
  }, []);

  return { isOpen, selectedItem, open, close, getLongPressHandlers, shouldPreventClick };
}
