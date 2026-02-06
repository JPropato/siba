import { useState, useRef, useCallback } from 'react';

interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color: string; // Tailwind bg color class
  onClick: () => void;
}

interface UseSwipeActionOptions {
  actions: SwipeAction[];
  threshold?: number; // Distancia mínima para considerar swipe (default: 50px)
  actionWidth?: number; // Ancho de cada acción revelada (default: 72px)
}

interface UseSwipeActionReturn {
  offsetX: number;
  isSwiping: boolean;
  isRevealed: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  close: () => void;
  actions: SwipeAction[];
  maxOffset: number;
}

export function useSwipeAction({
  actions,
  threshold = 50,
  actionWidth = 72,
}: UseSwipeActionOptions): UseSwipeActionReturn {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const maxOffset = actions.length * actionWidth;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsSwiping(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX.current - currentX;
      const diffY = startY.current - currentY;

      // Determinar dirección principal en el primer movimiento
      if (isHorizontal.current === null) {
        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
          isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
        }
        return;
      }

      // Solo procesar swipe horizontal
      if (!isHorizontal.current) return;

      // Prevenir scroll vertical durante swipe horizontal
      e.preventDefault();

      if (isRevealed) {
        // Si ya está revelado, calcular offset desde la posición revelada
        const newOffset = Math.max(0, Math.min(maxOffset + diffX, maxOffset * 1.2));
        setOffsetX(newOffset);
      } else {
        // Swipe hacia la izquierda para revelar acciones
        const newOffset = Math.max(0, Math.min(diffX, maxOffset * 1.2));
        setOffsetX(newOffset);
      }
    },
    [isSwiping, isRevealed, maxOffset]
  );

  const onTouchEnd = useCallback(() => {
    setIsSwiping(false);
    isHorizontal.current = null;

    if (offsetX >= threshold) {
      // Revelar acciones
      setOffsetX(maxOffset);
      setIsRevealed(true);
    } else {
      // Cerrar
      setOffsetX(0);
      setIsRevealed(false);
    }
  }, [offsetX, threshold, maxOffset]);

  const close = useCallback(() => {
    setOffsetX(0);
    setIsRevealed(false);
  }, []);

  return {
    offsetX,
    isSwiping,
    isRevealed,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    close,
    actions,
    maxOffset,
  };
}
