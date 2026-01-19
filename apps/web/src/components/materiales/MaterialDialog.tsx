import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MaterialFormData, Material } from '../../types/materiales';

interface MaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: MaterialFormData) => Promise<void>;
    initialData?: Material | null;
}

export default function MaterialDialog({ isOpen, onClose, onSave, initialData }: MaterialDialogProps) {
    const [codigoArticulo, setCodigoArticulo] = useState('');
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [presentacion, setPresentacion] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('');
    const [categoria, setCategoria] = useState('');
    const [stockMinimo, setStockMinimo] = useState<number | ''>('');

    // Pricing
    const [precioCosto, setPrecioCosto] = useState<number | ''>('');
    const [porcentajeRentabilidad, setPorcentajeRentabilidad] = useState<number | ''>('');
    const [precioVenta, setPrecioVenta] = useState<number | ''>('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | string[] | null>(null);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setCodigoArticulo(initialData.codigoArticulo);
                setNombre(initialData.nombre);
                setDescripcion(initialData.descripcion || '');
                setPresentacion(initialData.presentacion);
                setUnidadMedida(initialData.unidadMedida);
                setCategoria(initialData.categoria || '');
                setStockMinimo(initialData.stockMinimo || '');

                setPrecioCosto(Number(initialData.precioCosto));
                setPorcentajeRentabilidad(initialData.porcentajeRentabilidad);
                setPrecioVenta(Number(initialData.precioVenta));
            } else {
                setCodigoArticulo('');
                setNombre('');
                setDescripcion('');
                setPresentacion('');
                setUnidadMedida('');
                setCategoria('');
                setStockMinimo('');
                setPrecioCosto('');
                setPorcentajeRentabilidad(0);
                setPrecioVenta('');
            }
            setError(null);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setPrecioCosto('');
            setPorcentajeRentabilidad(0);
            setPrecioVenta('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialData]);

    // Pricing Logic
    const calculatePrecioVenta = (costo: number, rentabilidad: number) => {
        if (!costo) return 0;
        const margen = rentabilidad || 0;
        return costo * (1 + margen / 100);
    };

    const handleCostoChange = (val: string) => {
        const costo = val === '' ? '' : Number(val);
        setPrecioCosto(costo);
        if (costo !== '' && porcentajeRentabilidad !== '') {
            setPrecioVenta(calculatePrecioVenta(costo, Number(porcentajeRentabilidad)));
        }
    };

    const handleRentabilidadChange = (val: string) => {
        const rentabilidad = val === '' ? '' : Number(val);
        setPorcentajeRentabilidad(rentabilidad === '' ? 0 : rentabilidad);
        if (precioCosto !== '' && rentabilidad !== '') {
            setPrecioVenta(calculatePrecioVenta(Number(precioCosto), rentabilidad));
        }
    };

    const handlePrecioVentaChange = (val: string) => {
        const venta = val === '' ? '' : Number(val);
        setPrecioVenta(venta);
        // Si cambia el precio venta manual, recalculamos la rentabilidad
        if (venta !== '' && precioCosto && Number(precioCosto) > 0) {
            const rent = ((venta / Number(precioCosto)) - 1) * 100;
            setPorcentajeRentabilidad(parseFloat(rent.toFixed(2)));
        }
    };

    const formatError = (err: any) => {
        if (Array.isArray(err)) {
            return err.map((e: any) => e.message || e).join('. ');
        }
        return err?.toString() || 'Error desconocido';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSave({
                codigoArticulo: codigoArticulo.trim().toUpperCase(),
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                presentacion: presentacion.trim(),
                unidadMedida: unidadMedida.trim(),
                categoria: categoria.trim() || undefined,
                stockMinimo: stockMinimo ? Number(stockMinimo) : undefined,
                // Pricing
                precioCosto: Number(precioCosto) || 0,
                porcentajeRentabilidad: Number(porcentajeRentabilidad) || 0,
                precioVenta: Number(precioVenta) || 0
            });
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            setError(backendError || 'Error al guardar el material.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold">
                                {initialData ? 'Editar Material y Precios' : 'Nuevo Material'}
                            </h2>
                            {initialData && (
                                <span className="text-[10px] font-mono text-slate-400">
                                    ID INTERNO: #{initialData.codigoInterno.toString().padStart(4, '0')}
                                </span>
                            )}
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {formatError(error)}
                            </div>
                        )}


                        {/* Sección 1: Datos Básicos */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Columna Izquierda: Identificación */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Identificación</h3>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-brand">SKU / Código *</label>
                                    <input
                                        type="text"
                                        required
                                        value={codigoArticulo}
                                        onChange={(e) => setCodigoArticulo(e.target.value)}
                                        className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-brand/20 dark:border-brand/30 rounded-lg text-sm outline-none focus:border-brand transition-all font-mono font-bold uppercase tracking-widest"
                                        placeholder="ej: LIM-CL-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Material *</label>
                                    <input
                                        type="text"
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-bold"
                                        placeholder="Ej: Cloro Líquido"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</label>
                                    <select
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                        className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-medium"
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="Limpieza">Limpieza</option>
                                        <option value="Construcción">Construcción</option>
                                        <option value="Oficina">Oficina</option>
                                        <option value="Seguridad">Seguridad</option>
                                        <option value="Electrónica">Electrónica</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>

                            {/* Columna Derecha: Especificaciones */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Logística</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presentación *</label>
                                        <input
                                            type="text"
                                            required
                                            value={presentacion}
                                            onChange={(e) => setPresentacion(e.target.value)}
                                            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                            placeholder="Ej: Bidón 5L"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unidad *</label>
                                        <select
                                            required
                                            value={unidadMedida}
                                            onChange={(e) => setUnidadMedida(e.target.value)}
                                            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
                                        >
                                            <option value="">...</option>
                                            <option value="Unidades">Unid (Un)</option>
                                            <option value="Litros">Litros (L)</option>
                                            <option value="Kilogramos">Kilos (Kg)</option>
                                            <option value="Metros">Metros (m)</option>
                                            <option value="Cajas">Cajas</option>
                                            <option value="Packs">Packs</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-amber-600">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        value={stockMinimo}
                                        onChange={(e) => setStockMinimo(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Pricing */}
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">payments</span>
                                Estructura de Costos y Precios
                            </h3>
                            <div className="grid grid-cols-3 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Costo Unitario ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={precioCosto}
                                        onChange={(e) => handleCostoChange(e.target.value)}
                                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center block">Rentabilidad (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={porcentajeRentabilidad}
                                            onChange={(e) => handleRentabilidadChange(e.target.value)}
                                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            placeholder="0%"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-brand uppercase tracking-widest">Precio Venta ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={precioVenta}
                                        onChange={(e) => handlePrecioVentaChange(e.target.value)}
                                        className="w-full h-10 px-3 bg-brand/5 dark:bg-brand/10 border border-brand/50 rounded-lg text-base font-bold text-brand outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 text-center italic">
                                * El Precio Venta se calcula automáticamente base Costo + Rentabilidad.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 text-slate-900 dark:text-white">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    GUARDAR CAMBIOS
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
