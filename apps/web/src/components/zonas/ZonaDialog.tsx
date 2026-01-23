import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import type { Zona, ZonaFormData } from '../../types/zona';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';

const zonaSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    descripcion: z.string().optional().or(z.literal('')),
});

type ZonaFormValues = z.infer<typeof zonaSchema>;

interface ZonaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ZonaFormData) => Promise<void>;
    initialData?: Zona | null;
}

export default function ZonaDialog({ isOpen, onClose, onSave, initialData }: ZonaDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ZonaFormValues>({
        resolver: zodResolver(zonaSchema),
        defaultValues: { nombre: '', descripcion: '' },
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({ nombre: initialData.nombre, descripcion: initialData.descripcion || '' });
            } else {
                reset({ nombre: '', descripcion: '' });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (values: ZonaFormValues) => {
        try {
            await onSave({
                nombre: values.nombre.trim(),
                descripcion: values.descripcion?.trim() || undefined,
            });
            toast.success(initialData ? 'Zona actualizada' : 'Zona creada correctamente');
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            const message = Array.isArray(backendError)
                ? backendError.map((e: any) => e.message || e).join('. ')
                : backendError || 'Error al guardar la zona.';
            toast.error(message);
        }
    };

    return (
        <DialogBase
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Zona' : 'Nueva Zona'}
            description={initialData ? `ID Interno: #${initialData.codigo.toString().padStart(4, '0')}` : 'Defina una zona geográfica de operación.'}
            maxWidth="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="zona-form"
                        isLoading={isSubmitting}
                        leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
                    >
                        Guardar
                    </Button>
                </>
            }
        >
            <form id="zona-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Nombre de Zona *"
                    placeholder="Ej: GBA Norte"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                />
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</label>
                    <textarea
                        {...register('descripcion')}
                        className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none text-slate-900 dark:text-white"
                        placeholder="Breve descripción del área..."
                        rows={3}
                    />
                </div>
            </form>
        </DialogBase>
    );
}
