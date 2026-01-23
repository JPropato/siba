import { useState, useEffect } from 'react';
import api from '../lib/api';
import MaterialTable from '../components/materiales/MaterialTable';
import MaterialDialog from '../components/materiales/MaterialDialog';
import type { Material, MaterialFormData } from '../types/materiales';
import { Select } from '../components/ui/core/Select';
import { Search, LayoutGrid } from 'lucide-react';

export default function MaterialesPage() {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    const fetchMateriales = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/materials', {
                params: {
                    search: search || undefined,
                    categoria: categoriaFilter || undefined,
                    page,
                    limit: 10
                }
            });
            setMateriales(res.data.data || []);
            setTotalPages(res.data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching materiales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMateriales();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, categoriaFilter, page]);

    const handleCreate = () => {
        setSelectedMaterial(null);
        setIsModalOpen(true);
    };

    const handleEdit = (m: Material) => {
        setSelectedMaterial(m);
        setIsModalOpen(true);
    };

    const handleDelete = async (m: Material) => {
        if (!window.confirm(`¿Está seguro de eliminar el material "${m.nombre}"?`)) return;

        try {
            await api.delete(`/materials/${m.id}`);
            fetchMateriales();
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    };

    const handleSave = async (data: MaterialFormData) => {
        if (selectedMaterial) {
            await api.put(`/materials/${selectedMaterial.id}`, data);
        } else {
            await api.post('/materials', data);
        }
        fetchMateriales();
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Maestro de Materiales
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Gestión centralizada del catálogo de insumos, productos y equipamiento.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[20px]">add_box</span>
                    NUEVO MATERIAL
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por SKU, nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
                    />
                </div>
                <Select
                    className="w-full sm:w-48 h-10"
                    value={categoriaFilter}
                    onChange={(val) => {
                        setCategoriaFilter(val as string);
                        setPage(1);
                    }}
                    options={[
                        { value: '', label: 'Todas las categorías' },
                        { value: 'Limpieza', label: 'Limpieza' },
                        { value: 'Construcción', label: 'Construcción' },
                        { value: 'Oficina', label: 'Oficina' },
                        { value: 'Seguridad', label: 'Seguridad' },
                        { value: 'Electrónica', label: 'Electrónica' },
                        { value: 'Otros', label: 'Otros' },
                    ]}
                    icon={<LayoutGrid className="h-4 w-4" />}
                />
            </div>

            <MaterialTable
                materiales={materiales}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
            />

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-30"
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-slate-500 flex items-center px-2">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-30"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            <MaterialDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={selectedMaterial}
            />
        </div>
    );
}
