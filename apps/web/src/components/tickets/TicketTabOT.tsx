import { Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Plus, Save, Check, Building2, Upload, X, Edit2, Trash2 } from 'lucide-react';
import type { Ticket } from '../../types/tickets';
import { otApi } from '../../features/ordenes-trabajo/api/otApi';
import type { OrdenTrabajo, Archivo } from '../../features/ordenes-trabajo/types';
import { Button } from '../ui/core/Button';

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
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null);
  // Load OTs on mount
  useEffect(() => {
    loadOTs();
  }, [ticket.id]);

  const loadOTs = async () => {
    try {
      setIsLoading(true);
      const data = await otApi.getByTicketId(ticket.id);
      // Handle both single OT and array
      if (Array.isArray(data)) {
        setOrdenesTrabajo(data);
      } else if (data) {
        setOrdenesTrabajo([data]);
      } else {
        setOrdenesTrabajo([]);
      }
    } catch (err) {
      console.error('Error loading OTs:', err);
      setOrdenesTrabajo([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedOT(null);
    setDrawerOpen(true);
  };

  const handleEdit = (ot: OrdenTrabajo) => {
    setSelectedOT(ot);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setSelectedOT(null);
  };

  const handleSaveSuccess = () => {
    loadOTs();
    setDrawerOpen(false);
    setSelectedOT(null);
    onSuccess();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón Nueva OT */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Órdenes de Trabajo ({ordenesTrabajo.length})
        </h3>
        {ticket.estado !== 'FINALIZADO' && ticket.estado !== 'CANCELADO' && (
          <Button size="sm" onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
            Nueva OT
          </Button>
        )}
      </div>

      {/* Lista de OTs */}
      {ordenesTrabajo.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <ClipboardList className="h-9 w-9 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No hay órdenes de trabajo</p>
          {ticket.estado !== 'FINALIZADO' && ticket.estado !== 'CANCELADO' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNew}
              className="mt-4"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Crear primera OT
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ordenesTrabajo.map((ot) => (
            <div
              key={ot.id}
              className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-brand">
                      OT #{ot.numeroOT}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        ot.estado === 'FINALIZADO'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : ot.estado === 'EN_CURSO'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {ot.estado?.replace('_', ' ') || 'PENDIENTE'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {ot.descripcionTrabajo}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Creada: {formatDate(ot.createdAt || ot.fechaCreacion)}
                    {ot.archivos && ot.archivos.length > 0 && (
                      <span className="ml-2">• {ot.archivos.length} archivo(s)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(ot)}
                    className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                    title="Editar OT"
                    aria-label="Editar OT"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini Drawer para crear/editar OT */}
      {drawerOpen && (
        <OTMiniDrawer
          ticket={ticket}
          ot={selectedOT}
          onClose={handleClose}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}

// ============================================
// Mini Drawer Component para OT
// ============================================

interface OTMiniDrawerProps {
  ticket: Ticket;
  ot: OrdenTrabajo | null;
  onClose: () => void;
  onSuccess: () => void;
}

function OTMiniDrawer({ ticket, ot, onClose, onSuccess }: OTMiniDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [descripcion, setDescripcion] = useState(
    ot?.descripcionTrabajo || ticket.descripcion || ''
  );
  const [materiales, setMateriales] = useState(ot?.materialesUsados || '');
  const [savedFiles, setSavedFiles] = useState<Archivo[]>(ot?.archivos || []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizar = async () => {
    if (!ot) return;

    if (!confirm('¿Finalizar esta OT?')) return;

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      toast.success('OT finalizada');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerarObra = async () => {
    if (!ot) return;

    if (!confirm('¿Cerrar ticket y generar obra?')) return;

    setIsSaving(true);
    try {
      await otApi.finalizar(ot.id, {});
      onSuccess();
      navigate(`/dashboard/obras?createFrom=ticket&ticketId=${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
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
    } catch {
      toast.error('Error al eliminar archivo');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allFiles = [
    ...savedFiles.map((f) => ({ type: 'saved' as const, data: f })),
    ...pendingFiles.map((f) => ({ type: 'pending' as const, data: f })),
  ];

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[102] transition-opacity" onClick={onClose} />

      {/* Mini Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md z-[103] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {ot ? `Editar OT #${ot.numeroOT}` : 'Nueva Orden de Trabajo'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-[18px] w-[18px] text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Descripción del Trabajo *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand resize-none"
              placeholder="Describí el trabajo realizado..."
            />
          </div>

          {/* Materiales */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Materiales Utilizados
            </label>
            <textarea
              value={materiales}
              onChange={(e) => setMateriales(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand resize-none"
              placeholder="Listá los materiales usados..."
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Archivos Adjuntos
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand/50 rounded-lg p-4 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                className="hidden"
              />
              <Upload className="h-5 w-5 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">Click para agregar</p>
            </div>

            {/* File List */}
            {allFiles.length > 0 && (
              <div className="space-y-1">
                {allFiles.map((item) => (
                  <div
                    key={item.type === 'saved' ? `saved-${item.data.id}` : item.data.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                  >
                    <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
                      {item.type === 'saved' ? item.data.nombreOriginal : item.data.file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatSize(item.type === 'saved' ? item.data.tamanio : item.data.file.size)}
                    </span>
                    <button
                      onClick={() =>
                        item.type === 'saved'
                          ? handleDeleteSaved(item.data.id)
                          : handleRemovePending(item.data.id)
                      }
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {ot && ticket.estado !== 'FINALIZADO' && (
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFinalizar}
                disabled={isSaving}
                leftIcon={<Check className="h-4 w-4" />}
                className="flex-1 text-green-600"
              >
                Finalizar OT
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerarObra}
                disabled={isSaving}
                leftIcon={<Building2 className="h-4 w-4" />}
                className="flex-1 text-blue-600"
              >
                Generar Obra
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
              className="flex-1"
            >
              {ot ? 'Guardar' : 'Crear OT'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
