import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DialogBase } from './core/DialogBase';
import { Button } from './core/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setIsLoading(false);
    }
  };

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      icon={variant === 'danger' ? <AlertTriangle className="h-5 w-5 text-red-500" /> : undefined}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </DialogBase>
  );
}
