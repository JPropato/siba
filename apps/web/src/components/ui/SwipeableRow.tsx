import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSwipeAction } from '../../hooks/useSwipeAction';
import { cn } from '../../lib/utils';

interface SwipeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  color: string; // Tailwind classes ej: "bg-blue-500 text-white"
  onClick: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  actions: SwipeAction[];
  className?: string;
  actionWidth?: number;
  as?: 'div' | 'tr';
}

export const SwipeableRow = memo(function SwipeableRow({
  children,
  actions,
  className,
  actionWidth = 72,
  as = 'div',
}: SwipeableRowProps) {
  const { offsetX, isSwiping, handlers, close, maxOffset } = useSwipeAction({
    actions,
    actionWidth,
  });

  // Solo renderizar swipe UI en dispositivos táctiles (sm:hidden para las acciones)
  const showActions = offsetX > 5;

  if (as === 'tr') {
    return (
      <tr className={cn('relative', className)}>
        {/* Contenido de la fila - wrapper para swipe */}
        <td colSpan={100} className="p-0 relative overflow-hidden">
          <div className="relative">
            {/* Acciones detrás del contenido */}
            {showActions && (
              <div
                className="sm:hidden absolute right-0 top-0 bottom-0 flex items-stretch z-0"
                style={{ width: maxOffset }}
              >
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick();
                      close();
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 transition-transform',
                      action.color
                    )}
                    style={{ width: actionWidth }}
                  >
                    {action.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Contenido con offset */}
            <motion.div
              className="relative z-10 bg-white dark:bg-slate-950"
              animate={{ x: -offsetX }}
              transition={{
                type: isSwiping ? 'tween' : 'spring',
                duration: isSwiping ? 0 : 0.3,
                stiffness: 300,
                damping: 30,
              }}
              {...handlers}
            >
              <table className="w-full">
                <tbody>
                  <tr>{children}</tr>
                </tbody>
              </table>
            </motion.div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Acciones detrás del contenido - Solo móvil */}
      {showActions && (
        <div
          className="sm:hidden absolute right-0 top-0 bottom-0 flex items-stretch z-0"
          style={{ width: maxOffset }}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                close();
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-transform',
                action.color
              )}
              style={{ width: actionWidth }}
            >
              {action.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contenido con offset */}
      <motion.div
        className="relative z-10 bg-white dark:bg-slate-950"
        animate={{ x: -offsetX }}
        transition={{
          type: isSwiping ? 'tween' : 'spring',
          duration: isSwiping ? 0 : 0.3,
          stiffness: 300,
          damping: 30,
        }}
        {...handlers}
      >
        {children}
      </motion.div>
    </div>
  );
});
