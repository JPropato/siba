import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination - Componente de paginación con animaciones.
 *
 * @example
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 */
export const Pagination = memo(function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center justify-center gap-2', className)}
    >
      {/* Botón Anterior */}
      <motion.button
        onClick={() => canGoPrev && onPageChange(page - 1)}
        disabled={!canGoPrev}
        whileHover={canGoPrev ? { scale: 1.05 } : undefined}
        whileTap={canGoPrev ? { scale: 0.95 } : undefined}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          canGoPrev
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </motion.button>

      {/* Indicador de Página */}
      <div className="flex items-center gap-1 px-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={page}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-bold text-brand min-w-[2ch] text-center"
          >
            {page}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-slate-400">de</span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{totalPages}</span>
      </div>

      {/* Botón Siguiente */}
      <motion.button
        onClick={() => canGoNext && onPageChange(page + 1)}
        disabled={!canGoNext}
        whileHover={canGoNext ? { scale: 1.05 } : undefined}
        whileTap={canGoNext ? { scale: 0.95 } : undefined}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          canGoNext
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
        )}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
});

export default Pagination;
