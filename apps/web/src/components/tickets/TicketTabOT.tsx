import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Check, Building2, Upload } from 'lucide-react';
import type { Ticket } from '../../types/tickets';
import { otApi } from '../../features/ordenes-trabajo/api/otApi';
import type { OrdenTrabajo, Archivo } from '../../features/ordenes-trabajo/types';

interface PendingFile {
  id: string;
  file: File;
  preview: string;
}

interface TicketOTTabProps {
  ticket: Ticket;
  onSuccess: () => void;
}

export default function TicketTabOT({ ticket, onSuccess }: TicketOTTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ot, setOT] = useState<OrdenTrabajo | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [materiales, setMateriales] = useState('');
  const [savedFiles, setSavedFiles] = useState<Archivo[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load OT on mount
  useEffect(() => {
    loadOT();
  }, [ticket.id]);

  const loadOT = async () => {
    try {
      setIsLoading(true);
      const data = await otApi.getByTicketId(ticket.id);
      if (data) {
        setOT(data);
        setDescripcion(data.descripcionTrabajo);
        setMateriales(data.materialesUsados || '');
        setSavedFiles(data.archivos || []);
      } else {
        setDescripcion(ticket.descripcion || '');
        setMateriales('');
        setSavedFiles([]);
      }
    } catch (err) {
      console.error('Error loading OT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!descripcion.trim()) {
      setError('La descripción del trabajo es requerida');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      let otId = ot?.id;

      if (ot) {
        await otApi.update(ot.id, {
          descripcionTrabajo: descripcion,
          materialesUsados: materiales || null,
        });
      } else {
        const newOT = await otApi.create({
          ticketId: ticket.id,
          descripcionTrabajo: descripcion,
          materialesUsados: materiales || null,
        });
        setOT(newOT);
        otId = newOT.id;
      }

      // Upload pending files
      if (otId && pendingFiles.length > 0) {
        for (const pf of pendingFiles) {
          await otApi.uploadFile(pf.file, otId);
          URL.revokeObjectURL(pf.preview);
        }
        setPendingFiles([]);
      }

      toast.success(ot ? 'OT actualizada' : 'OT creada');
      await loadOT();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizar = async () => {
    if (!ot) return;

    if (!confirm('¿Finalizar la orden de trabajo? Esto marcará el ticket como FINALIZADO.')) {
      return;
    }

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      toast.success('Ticket finalizado');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerarObra = async () => {
    if (!ot) return;

    if (!confirm('¿Cerrar ticket y generar obra/presupuesto?')) {
      return;
    }

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      onSuccess();
      navigate(`/dashboard/obras?createFrom=ticket&ticketId=${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFiles = (fileList: FileList) => {
    const newFiles: PendingFile[] = Array.from(fileList).map((file) => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((pf) => pf.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((pf) => pf.id !== id);
    });
  };

  const handleDeleteSaved = async (fileId: number) => {
    try {
      await otApi.deleteFile(fileId);
      setSavedFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('Archivo eliminado');
    } catch (err) {
      toast.error('Error al eliminar archivo');
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
        <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">
          progress_activity
        </span>
      </div>
    );
  }

  const allFiles = [
    ...savedFiles.map((f) => ({ type: 'saved' as const, data: f })),
    ...pendingFiles.map((f) => ({ type: 'pending' as const, data: f })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {ot ? `OT #${ot.numeroOT}` : 'Nueva Orden de Trabajo'}
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Descripción del Trabajo *
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-gold transition-colors resize-none"
          placeholder="Describí el trabajo realizado..."
        />
      </div>

      {/* Materials */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Materiales Utilizados
        </label>
        <textarea
          value={materiales}
          onChange={(e) => setMateriales(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-gold transition-colors resize-none"
          placeholder="Listá los materiales usados..."
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Archivos Adjuntos
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-gold/50 rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-gold" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Click para agregar archivos
            </p>
            <p className="text-xs text-slate-400">Imágenes y PDF</p>
          </div>
        </div>

        {/* File List */}
        {allFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {allFiles.map((item) => (
              <div
                key={item.type === 'saved' ? `saved-${item.data.id}` : item.data.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                {/* Thumbnail */}
                {item.type === 'saved' ? (
                  isImage(item.data.mimeType) && item.data.url ? (
                    <img src={item.data.url} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500">
                        picture_as_pdf
                      </span>
                    </div>
                  )
                ) : item.data.file.type.startsWith('image/') ? (
                  <img src={item.data.preview} alt="" className="size-10 rounded object-cover" />
                ) : (
                  <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-500">picture_as_pdf</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {item.type === 'saved' ? item.data.nombreOriginal : item.data.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatSize(item.type === 'saved' ? item.data.tamanio : item.data.file.size)}
                    {item.type === 'pending' && (
                      <span className="ml-2 text-amber-500">(pendiente)</span>
                    )}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() =>
                    item.type === 'saved'
                      ? handleDeleteSaved(item.data.id)
                      : handleRemovePending(item.data.id)
                  }
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {ot && ticket.estado !== 'FINALIZADO' && (
            <>
              <button
                onClick={handleFinalizar}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-bold text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Finalizar OT
              </button>
              <button
                onClick={handleGenerarObra}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Generar Obra
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || ticket.estado === 'FINALIZADO'}
          className="px-6 py-2.5 bg-gold hover:bg-gold-light text-white text-sm font-bold rounded-lg shadow-lg shadow-gold/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {ot ? 'Guardar Cambios' : 'Crear OT'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
