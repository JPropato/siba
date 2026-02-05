import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search } from 'lucide-react';
import ZonaTable from '../components/zonas/ZonaTable';
import ZonaDialog from '../components/zonas/ZonaDialog';
import type { Zona, ZonaFormData } from '../types/zona';

export default function ZonasPage() {
  const [zones, setZones] = useState<Zona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zona | null>(null);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/zones', {
        params: { search: search || undefined },
      });
      if (res.data && res.data.data) {
        setZones(res.data.data);
      } else {
        setZones([]);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchZones();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = () => {
    setSelectedZone(null);
    setIsModalOpen(true);
  };

  const handleEdit = (zone: Zona) => {
    setSelectedZone(zone);
    setIsModalOpen(true);
  };

  const handleDelete = async (zone: Zona) => {
    if (!window.confirm(`¿Está seguro de eliminar la zona "${zone.nombre}"?`)) return;

    try {
      await api.delete(`/zones/${zone.id}`);
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  const handleSave = async (data: ZonaFormData) => {
    if (selectedZone) {
      await api.put(`/zones/${selectedZone.id}`, data);
    } else {
      await api.post('/zones', data);
    }
    fetchZones();
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestión de Zonas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre las áreas geográficas para sedes y logística.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-lg shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <MapPin className="h-5 w-5" />
          NUEVA ZONA
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de zona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>

      <ZonaTable zones={zones} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />

      <ZonaDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedZone}
      />
    </div>
  );
}
