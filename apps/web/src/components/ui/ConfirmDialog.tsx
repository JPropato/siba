import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

/**
 * ConfirmDialog Component
 *
 * Componente de diálogo de confirmación reutilizable.
 * Soporta acciones síncronas y asíncronas con estado de carga.
 *
 * @example
 * // Uso básico
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Eliminar ticket"
 *   description="¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer."
 *   variant="destructive"
 *   onConfirm={async () => {
 *     await deleteTicket(id);
 *     setOpen(false);
 *   }}
 * />
 *
 * @example
 * // Con textos personalizados
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Confirmar acción"
 *   description="Esta acción requiere confirmación."
 *   confirmText="Sí, continuar"
 *   cancelText="No, cancelar"
 *   onConfirm={() => handleAction()}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      // Solo cerrar si onConfirm no lo hace por sí mismo
      // Esperamos un tick para permitir que onConfirm cierre el diálogo si lo desea
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (open) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook useConfirmDialog
 *
 * Hook personalizado para gestionar el estado de ConfirmDialog.
 * Simplifica el uso del componente ConfirmDialog.
 *
 * @example
 * function MyComponent() {
 *   const { confirmDialog, showConfirm } = useConfirmDialog();
 *
 *   const handleDelete = () => {
 *     showConfirm({
 *       title: 'Eliminar elemento',
 *       description: '¿Estás seguro?',
 *       variant: 'destructive',
 *       onConfirm: async () => {
 *         await deleteItem();
 *       },
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Eliminar</button>
 *       {confirmDialog}
 *     </>
 *   );
 * }
 */
export function useConfirmDialog() {
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps | null>(null);

  const showConfirm = (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => {
    setDialogProps({
      ...props,
      open: true,
      onOpenChange: (open) => {
        if (!open) setDialogProps(null);
      },
    });
  };

  const confirmDialog = dialogProps ? <ConfirmDialog {...dialogProps} /> : null;

  return {
    confirmDialog,
    showConfirm,
    closeConfirm: () => setDialogProps(null),
  };
}
