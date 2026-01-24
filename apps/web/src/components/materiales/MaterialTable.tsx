import type { Material } from '../../types/materiales';
import { useSortableTable } from '../../hooks/useSortableTable';
import { SortableHeader } from '../ui/core/SortableHeader';

interface MaterialTableProps {
    materiales: Material[];
    onEdit: (material: Material) => void;
    onDelete: (material: Material) => void;
    isLoading: boolean;
}

export default function MaterialTable({ materiales, onEdit, onDelete, isLoading }: MaterialTableProps) {
    const { items, requestSort, sortConfig } = useSortableTable(materiales);

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-brand">progress_activity</span>
            </div>
        );
    }

    if (materiales.length === 0) {
        return (
            <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">No se encontraron materiales.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableHeader<Material> label="SKU / Código" sortKey="codigoArticulo" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader<Material> label="Material" sortKey="nombre" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader<Material> label="Categoría" sortKey="categoria" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Presentación</th>
                            <SortableHeader<Material> label="Costo" sortKey="precioCosto" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-center">Margen</th>
                            <SortableHeader<Material> label="Precio Venta" sortKey="precioVenta" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                        {items.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{m.codigoArticulo}</span>
                                        <span className="text-[10px] font-mono text-slate-400">#{m.codigoInterno.toString().padStart(4, '0')}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">{m.nombre}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.descripcion || 'Sin descripción'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-medium">
                                        {m.categoria || 'GENERAL'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col text-xs">
                                        <span className="font-medium">{m.presentacion}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400">Base: {m.unidadMedida}</span>
                                            {m.stockMinimo !== null && m.stockMinimo > 0 && (
                                                <span className="text-[10px] text-amber-500 font-bold" title={`Stock Mínimo: ${m.stockMinimo}`}>(Min: {m.stockMinimo})</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                                        ${Number(m.precioCosto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                                        {m.porcentajeRentabilidad}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                        ${Number(m.precioVenta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => onEdit(m)} className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => onDelete(m)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10" title="Eliminar">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
