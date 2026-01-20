import { useState, useEffect } from 'react';
import { obrasApi } from '../api/obrasApi';
import type { ComentarioObra, HistorialEstadoObra } from '../types';
import { ESTADO_OBRA_CONFIG } from '../types';
import { MessageSquare, History, Send, Trash2, ArrowRight } from 'lucide-react';

interface TabHistorialProps {
  obraId: number;
}

export default function TabHistorial({ obraId }: TabHistorialProps) {
  const [activeSubTab, setActiveSubTab] = useState<'historial' | 'comentarios'>('historial');
  const [historial, setHistorial] = useState<HistorialEstadoObra[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioObra[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [obraId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [historialData, comentariosData] = await Promise.all([
        obrasApi.getHistorial(obraId),
        obrasApi.getComentarios(obraId),
      ]);
      setHistorial(historialData);
      setComentarios(comentariosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      setIsSending(true);
      await obrasApi.createComentario(obraId, nuevoComentario.trim());
      setNuevoComentario('');
      await loadData();
    } catch (error) {
      console.error('Error sending comentario:', error);
      alert('Error al enviar comentario');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComentario = async (comentarioId: number) => {
    if (!confirm('¿Eliminar este comentario?')) return;

    try {
      await obrasApi.deleteComentario(obraId, comentarioId);
      await loadData();
    } catch (error) {
      console.error('Error deleting comentario:', error);
      alert('Error al eliminar comentario');
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveSubTab('historial')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'historial'
              ? 'border-gold text-gold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" />
          Historial de Estados
        </button>
        <button
          onClick={() => setActiveSubTab('comentarios')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'comentarios'
              ? 'border-gold text-gold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Comentarios ({comentarios.length})
        </button>
      </div>

      {/* Historial Content */}
      {activeSubTab === 'historial' && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cambios de estado registrados</p>
            </div>
          ) : (
            historial.map((item) => {
              const estadoAnteriorConfig = ESTADO_OBRA_CONFIG[item.estadoAnterior];
              const estadoNuevoConfig = ESTADO_OBRA_CONFIG[item.estadoNuevo];

              return (
                <div
                  key={item.id}
                  className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-2 border-gold" />

                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoAnteriorConfig?.color} ${estadoAnteriorConfig?.bgColor}`}
                      >
                        {estadoAnteriorConfig?.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoNuevoConfig?.color} ${estadoNuevoConfig?.bgColor}`}
                      >
                        {estadoNuevoConfig?.label}
                      </span>
                    </div>

                    {item.observacion && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {item.observacion}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        {item.usuario?.nombre} {item.usuario?.apellido}
                      </span>
                      <span>·</span>
                      <span>{formatDateTime(item.fechaCambio)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Comentarios Content */}
      {activeSubTab === 'comentarios' && (
        <div className="space-y-4">
          {/* Input para nuevo comentario */}
          <div className="flex gap-2">
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none"
              rows={2}
            />
            <button
              onClick={handleEnviarComentario}
              disabled={!nuevoComentario.trim() || isSending}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Lista de comentarios */}
          {comentarios.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay comentarios</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comentarios.map((comentario) => (
                <div
                  key={comentario.id}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                        {comentario.contenido}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span className="font-medium">
                          {comentario.usuario?.nombre} {comentario.usuario?.apellido}
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(comentario.fechaCreacion)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteComentario(comentario.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
