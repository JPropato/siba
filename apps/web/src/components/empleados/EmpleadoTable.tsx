import type { Empleado } from '../../types/empleados';

interface EmpleadoTableProps {
  empleados: Empleado[];
  onEdit: (empleado: Empleado) => void;
  onDelete: (empleado: Empleado) => void;
  isLoading: boolean;
}

export default function EmpleadoTable({
  empleados,
  onEdit,
  onDelete,
  isLoading,
}: EmpleadoTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-brand">
          progress_activity
        </span>
      </div>
    );
  }

  if (empleados.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No se encontraron empleados.</p>
      </div>
    );
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'GERENTE':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'ADMINISTRATIVO':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'TECNICO':
      default:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Empleado
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Contacto
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Tipo / Contratación
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                Zona Asignada
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {empleados.map((e) => (
              <tr
                key={e.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {e.apellido}, {e.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ingreso: {new Date(e.inicioRelacionLaboral).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col text-[11px]">
                    {e.email && (
                      <span className="text-slate-600 dark:text-slate-300">{e.email}</span>
                    )}
                    {e.telefono && <span className="text-slate-400">{e.telefono}</span>}
                    {!e.email && !e.telefono && (
                      <span className="italic text-slate-400">Sin datos</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTipoBadge(e.tipo)}`}
                    >
                      {e.tipo}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {e.contratacion.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {e.zona ? (
                    <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold border border-brand/20 uppercase">
                      {e.zona.nombre}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No asignada</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-1.5 text-slate-400 hover:text-brand transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(e)}
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
