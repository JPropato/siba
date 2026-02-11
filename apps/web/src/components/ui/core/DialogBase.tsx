import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

// Definir los tipos válidos para maxWidth
type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

interface DialogBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: MaxWidth;
  type?: 'modal' | 'drawer';
  icon?: ReactNode;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export const DialogBase = (props: DialogBaseProps) => {
  const { isOpen, onClose, title, description, children, footer, maxWidth = 'lg', icon } = props;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass = maxWidthClasses[maxWidth] || 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop - Solo visible en desktop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 hidden sm:block"
        onClick={onClose}
      />

      {/* Dialog - Full-screen en móvil, modal centrado en desktop */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col',
          // Fade-in limpio sin transforms (evita romper stacking context de portals)
          'h-[100dvh] sm:h-auto rounded-t-2xl sm:rounded-2xl animate-in fade-in duration-200',
          // Desktop: modal con max-height
          'sm:max-h-[90vh]',
          widthClass
        )}
      >
        {/* Mobile drag indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {icon && <div className="shrink-0 pt-0.5">{icon}</div>}
            <div className="space-y-0.5 sm:space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors -mr-2 sm:mr-0"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 custom-scrollbar">{children}</div>

        {/* Footer - Safe area para móviles con notch */}
        {footer && (
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sm:rounded-b-2xl flex justify-end items-center gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
