import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Loading Component
 *
 * Componente para mostrar estados de carga con animaciones shimmer.
 * Soporta múltiples variantes y animaciones personalizables.
 *
 * @example
 * // Skeleton de texto
 * <Skeleton variant="text" className="w-32 h-4" />
 *
 * @example
 * // Skeleton circular (avatar)
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * @example
 * // Skeleton rectangular con animación wave
 * <Skeleton variant="rectangular" width="100%" height={200} animation="wave" />
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-slate-200 dark:bg-slate-800';

  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={style}
      role="status"
      aria-label="Cargando..."
    />
  );
}

/**
 * SkeletonText - Skeleton específico para texto
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" className={cn('h-4', i === lines - 1 && 'w-4/5')} />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Skeleton específico para avatares
 */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

/**
 * SkeletonCard - Skeleton para cards completas
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <Skeleton variant="rectangular" className="h-32 w-full" />
    </div>
  );
}

/**
 * SkeletonTable - Skeleton para tablas
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
