import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Building2,
  Save,
  CloudUpload,
  FileIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OrdenTrabajo, Archivo, CreateOTPayload, UpdateOTPayload } from '../types';
import type { Ticket } from '../../../types/tickets';
import { otApi } from '../api/otApi';
import { useConfirm } from '../../../hooks/useConfirm';

interface PendingFile {
  id: string; // temporary ID for UI
  file: File;
  preview: string;
}

interface OTDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  existingOT?: OrdenTrabajo | null;
  onSuccess?: () => void;
}

export default function OTDialog({
  isOpen,
  onClose,
  ticket,
  existingOT,
  onSuccess,
}: OTDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ot, setOT] = useState<OrdenTrabajo | null>(existingOT || null);
  const [descripcion, setDescripcion] = useState('');
  const [materiales, setMateriales] = useState('');
  const [savedFiles, setSavedFiles] = useState<Archivo[]>([]); // Already saved files
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]); // Files to upload on save
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (existingOT) {
        setOT(existingOT);
        setDescripcion(existingOT.descripcionTrabajo);
        setMateriales(existingOT.materialesUsados || '');
        setSavedFiles(existingOT.archivos || []);
      } else if (ticket.id) {
        setIsLoading(true);
        otApi
          .getByTicketId(ticket.id)
          .then((data) => {
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
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
      setPendingFiles([]);
      setError(null);
    } else {
      // Cleanup previews when closing
      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    }
  }, [isOpen, existingOT, ticket]);

  const handleCancel = () => {
    // Cleanup previews
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
    setPendingFiles([]);
    onClose();
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
      const isCreating = !ot;

      if (ot) {
        // Update existing
        const updateData: UpdateOTPayload = {
          descripcionTrabajo: descripcion,
          materialesUsados: materiales || null,
        };
        await otApi.update(ot.id, updateData);
      } else {
        // Create new
        const createData: CreateOTPayload = {
          ticketId: ticket.id,
          descripcionTrabajo: descripcion,
          materialesUsados: materiales || null,
        };
        const newOT = await otApi.create(createData);
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

      onSuccess?.();

      // Solo cerrar si estamos actualizando, no al crear nueva
      // Así el usuario puede ver los botones de Finalizar/Generar Obra
      if (!isCreating) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizar = async () => {
    if (!ot) return;

    const ok = await confirm({
      title: 'Finalizar OT',
      message: '¿Finalizar la orden de trabajo? Esto marcará el ticket como FINALIZADO.',
      confirmLabel: 'Finalizar',
      variant: 'warning',
    });
    if (!ok) return;

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerarObra = async () => {
    if (!ot) return;

    const ok = await confirm({
      title: 'Generar obra',
      message:
        '¿Cerrar ticket y generar obra/presupuesto? El ticket será marcado como FINALIZADO y se abrirá el módulo de Obras.',
      confirmLabel: 'Generar Obra',
      variant: 'warning',
    });
    if (!ok) return;

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      onSuccess?.();
      onClose();
      // Navegar a obras con ticketId como parámetro para crear nueva obra
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar archivo');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (!isOpen) return null;

  const allFiles = [
    ...savedFiles.map((f) => ({ type: 'saved' as const, data: f })),
    ...pendingFiles.map((f) => ({ type: 'pending' as const, data: f })),
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-[101] w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {ot ? `OT #${ot.numeroOT}` : 'Nueva Orden de Trabajo'}
            </h2>
            <p className="text-sm text-slate-500">
              Ticket: TKT-{String(ticket.codigoInterno).padStart(5, '0')}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cliente
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.sucursal?.cliente?.razonSocial || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sucursal
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.sucursal?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Técnico
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.tecnico ? `${ticket.tecnico.nombre} ${ticket.tecnico.apellido}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.estado}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Descripción del Trabajo *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-gold transition-colors resize-none"
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-gold transition-colors resize-none"
                  placeholder="Listá los materiales usados..."
                />
              </div>

              {/* File Upload - Always visible */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Archivos Adjuntos
                </label>

                {/* Drop Zone */}
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
                      <CloudUpload className="h-5 w-5 text-gold" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Hacé click para agregar archivos
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
                            <img
                              src={item.data.url}
                              alt=""
                              className="size-10 rounded object-cover"
                            />
                          ) : (
                            <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                              <FileIcon className="h-5 w-5 text-slate-500" />
                            </div>
                          )
                        ) : item.data.file.type.startsWith('image/') ? (
                          <img
                            src={item.data.preview}
                            alt=""
                            className="size-10 rounded object-cover"
                          />
                        ) : (
                          <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-slate-500" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {item.type === 'saved' ? item.data.nombreOriginal : item.data.file.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatSize(
                              item.type === 'saved' ? item.data.tamanio : item.data.file.size
                            )}
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
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-4 p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {ot && ticket.estado !== 'FINALIZADO' && (
              <>
                <button
                  onClick={handleFinalizar}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-bold text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-[18px] w-[18px]" />
                    Finalizar OT
                  </span>
                </button>
                <button
                  onClick={handleGenerarObra}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-[18px] w-[18px]" />
                    Generar Obra
                  </span>
                </button>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 py-2.5 bg-gold hover:bg-gold-light text-white text-sm font-bold rounded-lg shadow-lg shadow-gold/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-[18px] w-[18px]" />
                  {ot ? 'Guardar Cambios' : 'Crear OT'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {ConfirmDialog}
    </div>
  );
}
