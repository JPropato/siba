import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { UserPlus, Loader2, Search, Check } from 'lucide-react';
import { useTecnicos } from '../../hooks/api/useTecnicos';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface InlineTecnicoAssignerProps {
  ticketId: number;
  ticketCode: string;
  currentTecnicoId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * InlineTecnicoAssigner - Popover compacto para asignar técnico a un ticket.
 * Se usa en KanbanBoard (drag NUEVO→ASIGNADO) y KanbanCard (botón "Asignar").
 */
export default function InlineTecnicoAssigner({
  ticketId,
  ticketCode,
  currentTecnicoId,
  onSuccess,
  onCancel,
}: InlineTecnicoAssignerProps) {
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: tecnicos = [], isLoading } = useTecnicos();

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Click outside to cancel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const filtered = tecnicos.filter((t) =>
    `${t.nombre} ${t.apellido}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (tecnicoId: number) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/tickets/${ticketId}/estado`, {
        estado: 'ASIGNADO',
        tecnicoId,
      });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      const tecnico = tecnicos.find((t) => t.id === tecnicoId);
      toast.success(`${ticketCode} asignado a ${tecnico?.nombre} ${tecnico?.apellido}`);
      onSuccess?.();
    } catch {
      toast.error('Error al asignar técnico');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[200] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <UserPlus className="h-3.5 w-3.5" />
          Asignar técnico
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">{ticketCode}</div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-7 pr-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-48 overflow-y-auto p-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-3 text-center text-xs text-slate-400">No se encontraron técnicos</div>
        ) : (
          filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => handleAssign(t.id)}
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors',
                'hover:bg-brand/10 hover:text-brand',
                currentTecnicoId === t.id
                  ? 'bg-brand/5 text-brand'
                  : 'text-slate-700 dark:text-slate-300',
                isSubmitting && 'opacity-50 pointer-events-none'
              )}
            >
              <div className="size-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {t.nombre.charAt(0)}
                {t.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {t.nombre} {t.apellido}
                </div>
              </div>
              {currentTecnicoId === t.id && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
            </button>
          ))
        )}
      </div>

      {/* Cancel */}
      <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onCancel}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
