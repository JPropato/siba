import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number; // Duración del press para activar (default: 500ms)
  onPress?: () => void; // Click normal (tap corto)
}

/**
 * Hook para detectar long-press en dispositivos táctiles
 *
 * @example
 * const longPressHandlers = useLongPress({
 *   onLongPress: () => setActionSheetOpen(true),
 *   onPress: () => navigate(`/detail/${id}`),
 * });
 *
 * <tr {...longPressHandlers}>...</tr>
 */
export function useLongPress({ onLongPress, delay = 500, onPress }: UseLongPressOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (e: React.TouchEvent) => {
      isLongPress.current = false;
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      timeoutRef.current = setTimeout(() => {
        isLongPress.current = true;
        // Haptic feedback si disponible
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const move = useCallback((e: React.TouchEvent) => {
    // Cancelar si el usuario movió el dedo (probablemente haciendo scroll)
    const diffX = Math.abs(e.touches[0].clientX - startPos.current.x);
    const diffY = Math.abs(e.touches[0].clientY - startPos.current.y);

    if (diffX > 10 || diffY > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  const end = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Si no fue long press, ejecutar onPress (tap normal)
    if (!isLongPress.current && onPress) {
      onPress();
    }
  }, [onPress]);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
  };
}
