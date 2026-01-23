import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Ticket, TicketFormData, RubroTicket, PrioridadTicket } from '../../types/tickets';
import { RUBRO_LABELS, PRIORIDAD_LABELS } from '../../types/tickets';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';

interface Sucursal { id: number; nombre: string; cliente?: { razonSocial: string }; }
interface Tecnico { id: number; nombre: string; apellido: string; }

const ticketSchema = z.object({
  codigoCliente: z.string().optional().or(z.literal('')),
  descripcion: z.string().min(3, 'La descripción es requerida'),
  trabajo: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  rubro: z.enum(['CIVIL', 'ELECTRICIDAD', 'SANITARIOS', 'VARIOS']),
  prioridad: z.enum(['PROGRAMADO', 'EMERGENCIA', 'URGENCIA']),
  fechaProgramada: z.string().optional().or(z.literal('')),
  sucursalId: z.string().min(1, 'Debe seleccionar una sucursal'),
  tecnicoId: z.string().optional().or(z.literal('')),
});


type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TicketFormData) => Promise<void>;
  initialData?: Ticket | null;
}

export default function TicketDialog({ isOpen, onClose, onSave, initialData }: TicketDialogProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      codigoCliente: '', descripcion: '', trabajo: '', observaciones: '',
      rubro: 'CIVIL', prioridad: 'PROGRAMADO', fechaProgramada: '',
      sucursalId: '', tecnicoId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      Promise.all([api.get('/sedes?limit=100'), api.get('/empleados?limit=100')])
        .then(([sedesRes, empleadosRes]) => {
          setSucursales(sedesRes.data.data || []);
          const allEmpleados = empleadosRes.data.data || [];
          setTecnicos(allEmpleados.filter((e: { tipo: string }) => e.tipo === 'TECNICO'));
        })
        .catch(console.error)
        .finally(() => setIsFetching(false));

      if (initialData) {
        reset({
          codigoCliente: initialData.codigoCliente || '',
          descripcion: initialData.descripcion,
          trabajo: initialData.trabajo || '',
          observaciones: initialData.observaciones || '',
          rubro: initialData.rubro,
          prioridad: initialData.prioridad,
          fechaProgramada: initialData.fechaProgramada ? new Date(initialData.fechaProgramada).toISOString().split('T')[0] : '',
          sucursalId: initialData.sucursalId.toString(),
          tecnicoId: initialData.tecnicoId?.toString() || '',
        });
      } else {
        reset({
          codigoCliente: '', descripcion: '', trabajo: '', observaciones: '',
          rubro: 'CIVIL', prioridad: 'PROGRAMADO', fechaProgramada: '',
          sucursalId: '', tecnicoId: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: TicketFormValues) => {
    try {
      await onSave({
        codigoCliente: values.codigoCliente?.trim() || null,
        descripcion: values.descripcion.trim(),
        trabajo: values.trabajo?.trim() || null,
        observaciones: values.observaciones?.trim() || null,
        rubro: values.rubro as RubroTicket,
        prioridad: values.prioridad as PrioridadTicket,
        fechaProgramada: values.fechaProgramada ? new Date(values.fechaProgramada).toISOString() : null,
        sucursalId: Number(values.sucursalId),
        tecnicoId: values.tecnicoId ? Number(values.tecnicoId) : null,
      });
      toast.success(initialData ? 'Ticket actualizado' : 'Ticket creado correctamente');
      onClose();
    } catch (err: any) {
      const backendError = err.response?.data?.error;
      toast.error(backendError || 'Error al guardar el ticket.');
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Ticket' : 'Nuevo Ticket'}
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
        {/* Datos del Ticket */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Datos del Ticket</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código Cliente" placeholder="1124-65005" {...register('codigoCliente')} />
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajo a Realizar</label>
            <textarea rows={2} {...register('trabajo')} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none text-slate-900 dark:text-white" placeholder="Trabajo propuesto..." />
          </div>
        </div>

        {/* Clasificación */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Clasificación</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rubro *</label>
              <select {...register('rubro')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                {Object.entries(RUBRO_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridad *</label>
              <select {...register('prioridad')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                {Object.entries(PRIORIDAD_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Programada</label>
              <input type="date" {...register('fechaProgramada')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Asignación */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Asignación</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico Asignado</label>
              <select disabled={isFetching} {...register('tecnicoId')} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white">
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (<option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>))}
              </select>
            </div>
            <Input label="Observaciones" placeholder="Notas adicionales..." {...register('observaciones')} />
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
