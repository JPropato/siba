import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Ticket, TicketFormData, RubroTicket, PrioridadTicket } from '../../types/tickets';
import { RUBRO_LABELS, PRIORIDAD_LABELS } from '../../types/tickets';
import { DialogBase } from '../ui/core/DialogBase';
import { Button } from '../ui/core/Button';

interface Sucursal { id: number; nombre: string; cliente?: { razonSocial: string }; }
interface User { id: number; nombre: string; apellido: string; }

const ticketSchema = z.object({
  descripcion: z.string().min(3, 'La descripción es requerida'),
  rubro: z.enum(['CIVIL', 'ELECTRICIDAD', 'SANITARIOS', 'VARIOS', 'REFRIGERACION', 'LIMPIEZA', 'TERMINACIONES']),
  prioridad: z.enum(['PROGRAMADO', 'EMERGENCIA', 'URGENCIA', 'BAJA', 'MEDIA', 'ALTA']),
  sucursalId: z.string().min(1, 'Debe seleccionar una sucursal'),
  tecnicoId: z.string().optional().or(z.literal('')),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket?: Ticket | null;
}

export default function TicketDialog({
  isOpen,
  onClose,
  onSuccess,
  ticket,
}: TicketDialogProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tecnicos, setTecnicos] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      descripcion: '',
      rubro: 'VARIOS',
      prioridad: 'MEDIA',
      sucursalId: '',
      tecnicoId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      Promise.all([api.get('/sedes?limit=100'), api.get('/users?role=TECNICO')])
        .then(([sedesRes, usersRes]) => {
          setSucursales(sedesRes.data.data || []);
          setTecnicos(usersRes.data.data || []);
        })
        .catch(console.error)
        .finally(() => setIsFetching(false));

      if (ticket) {
        reset({
          descripcion: ticket.descripcion,
          rubro: ticket.rubro as RubroTicket,
          prioridad: ticket.prioridad as PrioridadTicket,
          sucursalId: ticket.sucursalId.toString(),
          tecnicoId: ticket.tecnicoId?.toString() || '',
        });
      } else {
        reset({
          descripcion: '',
          rubro: 'VARIOS',
          prioridad: 'MEDIA',
          sucursalId: '',
          tecnicoId: '',
        });
      }
    }
  }, [isOpen, ticket, reset]);

  const onSubmit = async (values: TicketFormValues) => {
    try {
      const data: TicketFormData = {
        descripcion: values.descripcion.trim(),
        rubro: values.rubro as RubroTicket,
        prioridad: values.prioridad as PrioridadTicket,
        sucursalId: Number(values.sucursalId),
        tecnicoId: values.tecnicoId ? Number(values.tecnicoId) : null,
      };

      if (ticket) {
        await api.patch(`/tickets/${ticket.id}`, data);
        toast.success('Ticket actualizado');
      } else {
        await api.post('/tickets', data);
        toast.success('Ticket creado correctamente');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const backendError = error.response?.data?.error;
      toast.error(backendError || 'Error al guardar el ticket.');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={ticket ? 'Editar Ticket' : 'Nuevo Ticket'}
      description="Registre una solicitud de servicio."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="ticket-form"
            isLoading={isSubmitting}
            leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
          >
            Guardar Ticket
          </Button>
        </>
      }
    >
      <form id="ticket-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sucursal *</label>
              <select disabled={isFetching} {...register('sucursalId')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                <option value="">Seleccionar...</option>
                {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre} {s.cliente ? `(${s.cliente.razonSocial})` : ''}</option>))}
              </select>
              {errors.sucursalId && <p className="text-[11px] font-medium text-red-500">{errors.sucursalId.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción del Problema *</label>
            <textarea rows={3} {...register('descripcion')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none text-slate-900 dark:text-white" placeholder="Descripción detallada del problema..." />
            {errors.descripcion && <p className="text-[11px] font-medium text-red-500">{errors.descripcion.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rubro *</label>
              <select {...register('rubro')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                {Object.entries(RUBRO_LABELS).map(([k, v]) => (<option key={k} value={k}>{v as string}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad *</label>
              <select {...register('prioridad')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                {Object.entries(PRIORIDAD_LABELS).map(([k, v]) => (<option key={k} value={k}>{v as string}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico Asignado</label>
              <select disabled={isFetching} {...register('tecnicoId')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (<option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
