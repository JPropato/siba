import { memo, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: ReactNode;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  hideOnDesktop?: boolean;
}

/**
 * FloatingActionButton (FAB) Component
 *
 * Botón de acción flotante optimizado para móviles.
 * Sigue Material Design 3.0 guidelines para ergonomía táctil.
 *
 * @example
 * // FAB básico (solo móvil)
 * <FloatingActionButton
 *   onClick={handleCreate}
 *   icon={<Plus className="h-6 w-6" />}
 *   hideOnDesktop
 * />
 *
 * @example
 * // FAB extendido con label
 * <FloatingActionButton
 *   onClick={handleCreate}
 *   icon={<Plus className="h-6 w-6" />}
 *   label="Nuevo Ticket"
 *   variant="primary"
 *   size="lg"
 * />
 */
export const FloatingActionButton = memo(function FloatingActionButton({
  onClick,
  icon,
  label,
  className,
  variant = 'primary',
  size = 'md',
  position = 'bottom-right',
  hideOnDesktop = false,
}: FloatingActionButtonProps) {
  const variantStyles = {
    primary: 'bg-brand hover:bg-brand-dark text-white shadow-brand/20',
    secondary: 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-700/20',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
  };

  const sizeStyles = {
    sm: label ? 'h-12 px-4 gap-2' : 'h-12 w-12',
    md: label ? 'h-14 px-5 gap-2.5' : 'h-14 w-14',
    lg: label ? 'h-16 px-6 gap-3' : 'h-16 w-16',
  };

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'fixed z-50 rounded-full shadow-xl transition-all duration-200',
        'flex items-center justify-center font-bold text-sm',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        // Variant colors
        variantStyles[variant],
        // Size
        sizeStyles[size],
        // Position
        positionStyles[position],
        // Hide on desktop if specified
        hideOnDesktop && 'md:hidden',
        className
      )}
      aria-label={label || 'Acción principal'}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
});

/**
 * FABContainer - Contenedor para múltiples FABs
 *
 * Útil cuando necesitas mostrar múltiples acciones flotantes.
 *
 * @example
 * <FABContainer position="bottom-right">
 *   <FloatingActionButton icon={<Plus />} onClick={handleAdd} />
 *   <FloatingActionButton icon={<Edit />} onClick={handleEdit} variant="secondary" size="sm" />
 * </FABContainer>
 */
export const FABContainer = memo(function FABContainer({
  children,
  position = 'bottom-right',
  className,
}: {
  children: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}) {
  const positionStyles = {
    'bottom-right': 'bottom-6 right-6 flex-col-reverse',
    'bottom-left': 'bottom-6 left-6 flex-col-reverse',
    'top-right': 'top-6 right-6 flex-col',
    'top-left': 'top-6 left-6 flex-col',
  };

  return (
    <div className={cn('fixed z-50 flex gap-3', positionStyles[position], className)}>
      {children}
    </div>
  );
});
