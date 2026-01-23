import { useState, useEffect, useCallback } from 'react';
import { finanzasApi } from '../api/finanzasApi';
import type { Movimiento, MovimientoFilters, EstadoMovimiento, TipoMovimiento } from '../types';
import {
  History,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react';
import {
  ESTADO_MOVIMIENTO_CONFIG,
  MEDIO_PAGO_LABELS,
  CATEGORIA_INGRESO_LABELS,
  CATEGORIA_EGRESO_LABELS,
} from '../types';
import MovimientoDrawer from '../components/MovimientoDrawer';
import { Select } from '@/components/ui/core/Select';
import { LayoutGrid, AlertCircle } from 'lucide-react';

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoMovimiento | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchMovimientos = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: MovimientoFilters = {
        page,
        limit: 15,
      };
      if (search) filters.search = search;
      if (tipoFilter) filters.tipo = tipoFilter as TipoMovimiento;
      if (estadoFilter) filters.estado = estadoFilter as EstadoMovimiento;

      const res = await finanzasApi.getMovimientos(filters);
      setMovimientos(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, tipoFilter, estadoFilter]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-7 w-7 text-gold" />
              Movimientos Financieros
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {total} registros encontrados
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nuevo
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros Avanzados</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción, comprobante..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all"
              />
            </div>
            <Select
              className="h-10"
              value={tipoFilter}
              onChange={(val) => {
                setTipoFilter(val as TipoMovimiento | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos los tipos' },
                { value: 'INGRESO', label: 'Ingresos' },
                { value: 'EGRESO', label: 'Egresos' },
              ]}
              icon={<LayoutGrid className="h-4 w-4" />}
            />
            <Select
              className="h-10"
              value={estadoFilter}
              onChange={(val) => {
                setEstadoFilter(val as EstadoMovimiento | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos los estados' },
                ...Object.entries(ESTADO_MOVIMIENTO_CONFIG).map(([key, { label }]) => ({
                  value: key,
                  label,
                })),
              ]}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Descripción / Categoría
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Cuenta / Medio
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Entidad
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                        <span className="text-xs font-medium">Cargando movimientos...</span>
                      </div>
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-20 text-center text-slate-400 italic text-sm"
                    >
                      No se encontraron registros que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov) => {
                    const estado = ESTADO_MOVIMIENTO_CONFIG[mov.estado];
                    const categoriaLabel =
                      mov.tipo === 'INGRESO'
                        ? CATEGORIA_INGRESO_LABELS[mov.categoriaIngreso!]
                        : CATEGORIA_EGRESO_LABELS[mov.categoriaEgreso!];

                    return (
                      <tr
                        key={mov.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatDate(mov.fechaMovimiento)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {mov.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {categoriaLabel}
                            </span>
                            {mov.comprobante && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
                                #{mov.comprobante}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {mov.cuenta?.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {MEDIO_PAGO_LABELS[mov.medioPago]}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {mov.cliente ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-brand">
                                {mov.cliente.razonSocial}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase font-bold">
                                Cliente
                              </span>
                            </div>
                          ) : mov.obra ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gold">{mov.obra.codigo}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-bold">
                                Obra
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estado.color} ${estado.bgColor}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div
                            className={`text-sm font-bold flex items-center justify-end gap-1 ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {mov.tipo === 'INGRESO' ? '+' : '-'} {formatCurrency(mov.monto)}
                            {mov.tipo === 'INGRESO' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Página <span className="font-bold text-slate-900 dark:text-white">{page}</span> de{' '}
                <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  Siguiente
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <MovimientoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          fetchMovimientos();
          setIsDrawerOpen(false);
        }}
      />
    </>
  );
}
