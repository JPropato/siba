import type { Cliente } from '../../types/client';

interface ClientTableProps {
    clients: Cliente[];
    onEdit: (client: Cliente) => void;
    onDelete: (client: Cliente) => void;
    isLoading: boolean;
}

export default function ClientTable({ clients, onEdit, onDelete, isLoading }: ClientTableProps) {
    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-brand">progress_activity</span>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">No se encontraron clientes.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Cód.</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Razón Social</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">CUIT / ID Fiscal</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">Contacto</th>
                            <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                        {clients.map((client) => (
                            <tr
                                key={client.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold tracking-wider border border-brand/20">
                                        #{client.codigo?.toString().padStart(4, '0') || '----'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {client.razonSocial}
                                        </span>
                                        {client.direccionFiscal && (
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                {client.direccionFiscal}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {client.cuit ? (
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{client.cuit}</span>
                                    ) : (
                                        <span className="text-slate-400 italic text-xs">No informado</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        {client.email && (
                                            <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                                {client.email}
                                            </span>
                                        )}
                                        {client.telefono && (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                                {client.telefono}
                                            </span>
                                        )}
                                        {!client.email && !client.telefono && (
                                            <span className="text-slate-400 italic text-[11px]">Sin contacto</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(client)}
                                            className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(client)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/10"
                                            title="Eliminar"
                                        >
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
