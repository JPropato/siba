import type { Vehiculo } from '../../types/vehiculos';
import { useSortableTable } from '../../hooks/useSortableTable';
import { SortableHeader } from '../ui/core/SortableHeader';

interface VehiculoTableProps {
    vehiculos: Vehiculo[];
    onEdit: (vehiculo: Vehiculo) => void;
    onDelete: (vehiculo: Vehiculo) => void;
    isLoading: boolean;
}

export default function VehiculoTable({ vehiculos, onEdit, onDelete, isLoading }: VehiculoTableProps) {
    const { items, requestSort, sortConfig } = useSortableTable(vehiculos);

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-brand">progress_activity</span>
            </div>
        );
    }

    if (vehiculos.length === 0) {
        return (
            <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">No se encontraron vehículos.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <SortableHeader<Vehiculo> label="Cód / Patente" sortKey="patente" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader<Vehiculo> label="Marca / Modelo" sortKey="marca" sortConfig={sortConfig} onSort={requestSort} />
                            <SortableHeader<Vehiculo> label="Estado" sortKey="estado" sortConfig={sortConfig} onSort={requestSort} />
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Zona Asignada</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                        {items.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-mono text-slate-400">#{v.codigoInterno.toString().padStart(4, '0')}</span>
                                        <div className="inline-flex items-center justify-center px-2 py-0.5 bg-brand text-white font-bold rounded shadow-sm border border-brand-dark/20 text-[11px] tracking-wider w-fit">
                                            {v.patente}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">
                                            {v.marca || <span className="opacity-30 italic">Sin marca</span>}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold uppercase opacity-80">
                                            {v.modelo} {v.anio && `(${v.anio})`}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{v.tipo || 'General'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${v.estado === 'ACTIVO' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                v.estado === 'TALLER' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                                                    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                            {v.estado.replace('_', ' ')}
                                        </span>
                                        {(v.proximosKm || v.proximoService) && (
                                            <div className="flex flex-col text-[10px] text-slate-500">
                                                {v.proximosKm && <span>Prox. Km: <strong>{v.proximosKm.toLocaleString()}</strong></span>}
                                                {v.proximoService && <span>Service: <strong>{new Date(v.proximoService).toLocaleDateString()}</strong></span>}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {v.zona ? (
                                        <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold border border-brand/20 uppercase">
                                            {v.zona.nombre}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">No asignada</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => onEdit(v)} className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button onClick={() => onDelete(v)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10" title="Eliminar">
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
