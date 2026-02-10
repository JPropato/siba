import { useState, useCallback, useRef } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions & { isOpen: boolean }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, isOpen: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const dialog = (
    <ConfirmDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
    />
  );

  return { confirm, ConfirmDialog: dialog };
}
