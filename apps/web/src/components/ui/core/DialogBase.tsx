import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

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
  const {
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    maxWidth = 'lg',
    type = 'modal',
    icon,
  } = props;

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

  const isDrawer = type === 'drawer';
  const widthClass = maxWidthClasses[maxWidth] || 'max-w-lg';

  if (isDrawer) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Drawer panel - slides from right */}
        <div
          className={cn(
            'relative w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col',
            'h-full animate-in slide-in-from-right duration-300',
            widthClass
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              {icon && <div className="shrink-0 pt-0.5">{icon}</div>}
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-h-10 min-w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors -mr-1"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end items-center gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // Modal (default)
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop - Solo visible en desktop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 hidden sm:block"
        onClick={onClose}
      />

      {/* Dialog - Full-screen en movil, modal centrado en desktop */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col',
          'h-[100dvh] sm:h-auto rounded-t-2xl sm:rounded-2xl animate-in fade-in duration-200',
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

        {/* Footer - Safe area para moviles con notch */}
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
