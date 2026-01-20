import { useState, useEffect, useRef } from 'react';
import { obrasApi } from '../api/obrasApi';
import type { ArchivoObra } from '../types';
import { Upload, FileText, Image, File, Trash2, Download } from 'lucide-react';

interface TabArchivosProps {
  obraId: number;
  isReadOnly?: boolean;
}

const TIPOS_ARCHIVO = [
  { value: 'PLANO', label: 'Plano' },
  { value: 'FOTO_ANTES', label: 'Foto Antes' },
  { value: 'FOTO_DESPUES', label: 'Foto Después' },
  { value: 'PRESUPUESTO_PDF', label: 'Presupuesto PDF' },
  { value: 'OTRO', label: 'Otro' },
];

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TabArchivos({ obraId, isReadOnly }: TabArchivosProps) {
  const [archivos, setArchivos] = useState<ArchivoObra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [tipoArchivo, setTipoArchivo] = useState('OTRO');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadArchivos();
  }, [obraId]);

  const loadArchivos = async () => {
    try {
      setIsLoading(true);
      const data = await obrasApi.getArchivos(obraId);
      setArchivos(data);
    } catch (error) {
      console.error('Error loading archivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await obrasApi.uploadArchivo(obraId, file, tipoArchivo);
      await loadArchivos();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading archivo:', error);
      alert('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (archivoId: number) => {
    if (!confirm('¿Eliminar este archivo?')) return;

    try {
      await obrasApi.deleteArchivo(obraId, archivoId);
      await loadArchivos();
    } catch (error) {
      console.error('Error deleting archivo:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const getFileUrl = (archivo: ArchivoObra) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${apiUrl}${archivo.url}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {!isReadOnly && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tipo de archivo
              </label>
              <select
                value={tipoArchivo}
                onChange={(e) => setTipoArchivo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
              >
                {TIPOS_ARCHIVO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      {archivos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay archivos adjuntos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {archivos.map((archivo) => {
            const IconComponent = getFileIcon(archivo.mimeType);
            const isImage = archivo.mimeType.startsWith('image/');

            return (
              <div
                key={archivo.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                {isImage ? (
                  <img
                    src={getFileUrl(archivo)}
                    alt={archivo.nombreOriginal}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
                    <IconComponent className="h-6 w-6 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {archivo.nombreOriginal}
                  </p>
                  <p className="text-xs text-slate-500">
                    {TIPOS_ARCHIVO.find((t) => t.value === archivo.tipoArchivo)?.label ||
                      archivo.tipoArchivo}
                    {' · '}
                    {formatFileSize(archivo.tamanio)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={getFileUrl(archivo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(archivo.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
