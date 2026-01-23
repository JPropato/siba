import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import type { MaterialFormData, Material } from '../../types/materiales';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { Layers, Weight } from 'lucide-react';

const materialSchema = z.object({
    codigoArticulo: z.string().min(1, 'El código es requerido'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    descripcion: z.string().optional().or(z.literal('')),
    presentacion: z.string().min(1, 'La presentación es requerida'),
    unidadMedida: z.string().min(1, 'La unidad es requerida'),
    categoria: z.string().optional().or(z.literal('')),
    stockMinimo: z.string().optional().or(z.literal('')),
    precioCosto: z.string().optional().or(z.literal('')),
    porcentajeRentabilidad: z.string().optional().or(z.literal('')),
    precioVenta: z.string().optional().or(z.literal('')),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: MaterialFormData) => Promise<void>;
    initialData?: Material | null;
}

export default function MaterialDialog({ isOpen, onClose, onSave, initialData }: MaterialDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<MaterialFormValues>({
        resolver: zodResolver(materialSchema),
        defaultValues: {
            codigoArticulo: '',
            nombre: '',
            descripcion: '',
            presentacion: '',
            unidadMedida: '',
            categoria: '',
            stockMinimo: '',
            precioCosto: '',
            porcentajeRentabilidad: '0',
            precioVenta: '',
        },
    });

    const precioCosto = watch('precioCosto');
    const porcentajeRentabilidad = watch('porcentajeRentabilidad');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    codigoArticulo: initialData.codigoArticulo,
                    nombre: initialData.nombre,
                    descripcion: initialData.descripcion || '',
                    presentacion: initialData.presentacion,
                    unidadMedida: initialData.unidadMedida,
                    categoria: initialData.categoria || '',
                    stockMinimo: initialData.stockMinimo?.toString() || '',
                    precioCosto: initialData.precioCosto?.toString() || '',
                    porcentajeRentabilidad: initialData.porcentajeRentabilidad?.toString() || '0',
                    precioVenta: initialData.precioVenta?.toString() || '',
                });
            } else {
                reset({
                    codigoArticulo: '',
                    nombre: '',
                    descripcion: '',
                    presentacion: '',
                    unidadMedida: '',
                    categoria: '',
                    stockMinimo: '',
                    precioCosto: '',
                    porcentajeRentabilidad: '0',
                    precioVenta: '',
                });
            }
        }
    }, [isOpen, initialData, reset]);

    // Recalculate precio venta when costo or rentabilidad changes
    useEffect(() => {
        const costo = parseFloat(precioCosto || '0');
        const rent = parseFloat(porcentajeRentabilidad || '0');
        if (costo > 0) {
            const venta = costo * (1 + rent / 100);
            setValue('precioVenta', venta.toFixed(2));
        }
    }, [precioCosto, porcentajeRentabilidad, setValue]);

    const onSubmit = async (values: MaterialFormValues) => {
        try {
            await onSave({
                codigoArticulo: values.codigoArticulo.trim().toUpperCase(),
                nombre: values.nombre.trim(),
                descripcion: values.descripcion?.trim() || undefined,
                presentacion: values.presentacion.trim(),
                unidadMedida: values.unidadMedida.trim(),
                categoria: values.categoria?.trim() || undefined,
                stockMinimo: values.stockMinimo ? Number(values.stockMinimo) : undefined,
                precioCosto: Number(values.precioCosto) || 0,
                porcentajeRentabilidad: Number(values.porcentajeRentabilidad) || 0,
                precioVenta: Number(values.precioVenta) || 0,
            });
            toast.success(initialData ? 'Material actualizado' : 'Material creado correctamente');
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            const message = Array.isArray(backendError)
                ? backendError.map((e: any) => e.message || e).join('. ')
                : backendError || 'Error al guardar el material.';
            toast.error(message);
        }
    };

    return (
        <DialogBase
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Material y Precios' : 'Nuevo Material'}
            description={initialData ? `ID Interno: #${initialData.codigoInterno.toString().padStart(4, '0')}` : 'Complete los datos del material.'}
            maxWidth="2xl"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="material-form"
                        isLoading={isSubmitting}
                        leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
                    >
                        Guardar Cambios
                    </Button>
                </>
            }
        >
            <form id="material-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Columna Izquierda: Identificación */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Identificación</h3>
                        <Input
                            label="SKU / Código *"
                            placeholder="ej: LIM-CL-500"
                            {...register('codigoArticulo')}
                            error={errors.codigoArticulo?.message}
                            className="font-mono font-bold uppercase tracking-widest"
                        />
                        <Input
                            label="Nombre del Material *"
                            placeholder="Ej: Cloro Líquido"
                            {...register('nombre')}
                            error={errors.nombre?.message}
                        />
                        <Controller
                            name="categoria"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    label="Categoría"
                                    options={[
                                        { value: 'Limpieza', label: 'Limpieza' },
                                        { value: 'Construcción', label: 'Construcción' },
                                        { value: 'Oficina', label: 'Oficina' },
                                        { value: 'Seguridad', label: 'Seguridad' },
                                        { value: 'Electrónica', label: 'Electrónica' },
                                        { value: 'Otros', label: 'Otros' },
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Seleccione..."
                                    icon={<Layers className="h-4 w-4" />}
                                />
                            )}
                        />
                    </div>

                    {/* Columna Derecha: Especificaciones */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Logística</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Presentación *"
                                placeholder="Ej: Bidón 5L"
                                {...register('presentacion')}
                                error={errors.presentacion?.message}
                            />
                            <Controller
                                name="unidadMedida"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Unidad *"
                                        options={[
                                            { value: 'Unidades', label: 'Unid (Un)' },
                                            { value: 'Litros', label: 'Litros (L)' },
                                            { value: 'Kilogramos', label: 'Kilos (Kg)' },
                                            { value: 'Metros', label: 'Metros (m)' },
                                            { value: 'Cajas', label: 'Cajas' },
                                            { value: 'Packs', label: 'Packs' },
                                        ]}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="..."
                                        icon={<Weight className="h-4 w-4" />}
                                        error={errors.unidadMedida?.message}
                                    />
                                )}
                            />
                        </div>
                        <Input
                            label="Stock Mínimo"
                            type="number"
                            placeholder="0"
                            {...register('stockMinimo')}
                            error={errors.stockMinimo?.message}
                        />
                    </div>
                </div>

                {/* Sección de Pricing */}
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        Estructura de Costos y Precios
                    </h3>
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <Input
                            label="Costo Unitario ($)"
                            type="number"
                            placeholder="0.00"
                            {...register('precioCosto')}
                            error={errors.precioCosto?.message}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center block">Rentabilidad (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register('porcentajeRentabilidad')}
                                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 text-center outline-none focus:border-blue-500 transition-all"
                                    placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                        <Input
                            label="Precio Venta ($)"
                            type="number"
                            placeholder="0.00"
                            {...register('precioVenta')}
                            error={errors.precioVenta?.message}
                            className="bg-brand/5 border-brand/50 text-brand font-bold"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 text-center italic">
                        * El Precio Venta se calcula automáticamente base Costo + Rentabilidad.
                    </p>
                </div>
            </form>
        </DialogBase>
    );
}
