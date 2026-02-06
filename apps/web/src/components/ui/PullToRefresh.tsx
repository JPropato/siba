import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { cn } from '../../lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
}

export const PullToRefresh = memo(function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, isPulling, handlers } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  // Calcular progreso (0 a 1)
  const progress = Math.min(pullDistance / threshold, 1);

  // Solo mostrar indicador en móvil
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div className={cn('relative overflow-auto', className)} {...handlers}>
      {/* Indicador de Pull - Solo visible en móvil */}
      <motion.div
        className="sm:hidden absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        initial={false}
        animate={{
          y: showIndicator ? pullDistance - 40 : -60,
          opacity: showIndicator ? 1 : 0,
        }}
        transition={{
          type: isPulling ? 'tween' : 'spring',
          duration: isPulling ? 0 : 0.3,
          stiffness: 300,
          damping: 25,
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full shadow-lg',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          )}
        >
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : progress * 180,
            }}
            transition={{
              rotate: isRefreshing
                ? { repeat: Infinity, duration: 1, ease: 'linear' }
                : { duration: 0 },
            }}
          >
            <RefreshCw
              className={cn(
                'h-5 w-5 transition-colors',
                progress >= 1 || isRefreshing ? 'text-brand' : 'text-slate-400'
              )}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Contenido con offset durante pull */}
      <motion.div
        animate={{
          y: pullDistance,
        }}
        transition={{
          type: isPulling ? 'tween' : 'spring',
          duration: isPulling ? 0 : 0.3,
          stiffness: 300,
          damping: 25,
        }}
      >
        {children}
      </motion.div>

      {/* Texto de ayuda - Solo cuando se está tirando */}
      {isPulling && pullDistance > 20 && (
        <motion.div
          className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-xs font-medium text-slate-400">
            {progress >= 1 ? 'Suelta para actualizar' : 'Tira para actualizar'}
          </span>
        </motion.div>
      )}
    </div>
  );
});
