import { memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionSheetAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

interface MobileActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
}

export const MobileActionSheet = memo(function MobileActionSheet({
  open,
  onClose,
  title,
  actions,
}: MobileActionSheetProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl sm:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {title && (
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {title}
                </p>
              </div>
            )}

            <div className="py-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 min-h-12 text-left active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${
                    action.variant === 'destructive'
                      ? 'text-red-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {action.icon && <span className="shrink-0">{action.icon}</span>}
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 pt-1">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
});
