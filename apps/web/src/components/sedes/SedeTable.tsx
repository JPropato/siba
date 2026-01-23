import type { Sede } from '../../types/sedes';
import { useSortableTable } from '../../hooks/useSortableTable';
import { SortableHeader } from '../ui/core/SortableHeader';

interface SedeTableProps {
    sedes: Sede[];
    onEdit: (sede: Sede) => void;
    onDelete: (sede: Sede) => void;
    isLoading: boolean;
}

export default function SedeTable({ sedes, onEdit, onDelete, isLoading }: SedeTableProps) {
    const { items, requestSort, sortConfig } = useSortableTable(sedes);

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-brand">progress_activity</span>
            </div>
        );
    }

    if (sedes.length === 0) {
        return (
            <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">No se encontraron sedes.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableHeader<Sede> label="ID / Cod. Ext" sortKey="codigoInterno" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader<Sede> label="Sede / Cliente" sortKey="nombre" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Zona</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Ubicación</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Contacto</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                        {items.map((sede) => (
                            <tr key={sede.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[10px] font-mono">#{sede.codigoInterno.toString().padStart(4, '0')}</span>
                                        {sede.codigoExterno && <span className="text-brand font-bold text-[10px]">{sede.codigoExterno}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">{sede.nombre}</span>
                                        <span className="text-[10px] text-slate-500 font-semibold uppercase opacity-80">{sede.cliente?.razonSocial}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 uppercase">
                                        {sede.zona?.nombre}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{sede.direccion}</span>
                                        {sede.telefono && <span className="text-[10px] text-slate-500">{sede.telefono}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                            {sede.contactoNombre || <span className="text-slate-400 italic">No asignado</span>}
                                        </span>
                                        {sede.contactoTelefono && <span className="text-[10px] text-slate-500">{sede.contactoTelefono}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => onEdit(sede)} className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => onDelete(sede)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10" title="Eliminar">
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
