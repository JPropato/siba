import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, Trash2, Download, FileText } from 'lucide-react';
import api from '../../lib/api';

interface TicketTabArchivosProps {
  ticketId: number;
}

interface Archivo {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  tamanio: number;
  url: string;
  fechaCreacion: string;
}

export default function TicketTabArchivos({ ticketId }: TicketTabArchivosProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadArchivos();
  }, [ticketId]);

  const loadArchivos = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tickets/${ticketId}/archivos`);
      setArchivos(res.data || []);
    } catch (error) {
      console.error('Error loading archivos:', error);
      // Si no existe el endpoint, mostrar vacío
      setArchivos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/tickets/${ticketId}/archivos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Archivo(s) subido(s)');
      await loadArchivos();
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Error al subir archivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este archivo?')) return;

    try {
      await api.delete(`/tickets/${ticketId}/archivos/${id}`);
      toast.success('Archivo eliminado');
      setArchivos((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-gold/50 rounded-xl p-6 text-center cursor-pointer transition-colors">
        <input
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          multiple
          onChange={handleUpload}
          disabled={isUploading}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-gold" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isUploading ? 'Subiendo...' : 'Click para agregar archivos'}
          </p>
          <p className="text-xs text-slate-400">Imágenes, PDF, Word, Excel</p>
        </div>
      </label>

      {/* File List */}
      {archivos.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay archivos adjuntos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {archivos.map((archivo) => (
            <div
              key={archivo.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              {/* Thumbnail */}
              {isImage(archivo.mimeType) && archivo.url ? (
                <img src={archivo.url} alt="" className="size-10 rounded object-cover" />
              ) : (
                <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {archivo.nombreOriginal}
                </p>
                <p className="text-xs text-slate-400">{formatSize(archivo.tamanio)}</p>
              </div>

              {/* Actions */}
              <a
                href={archivo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => handleDelete(archivo.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
