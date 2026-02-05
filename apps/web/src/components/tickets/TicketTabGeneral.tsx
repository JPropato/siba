import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, Edit2, X as CloseIcon } from 'lucide-react';
import api from '../../lib/api';
import type { Ticket } from '../../types/tickets';
import { RUBRO_LABELS, TIPO_TICKET_LABELS } from '../../types/tickets';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';

interface TicketDetailTabProps {
  ticket: Ticket;
  onUpdate: () => void;
  onSuccess: () => void;
}

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
}

const editSchema = z.object({
  descripcion: z.string().min(3, 'Mínimo 3 caracteres'),
  rubro: z.string().min(1),
  tipoTicket: z.string().min(1),
  tecnicoId: z.union([z.number(), z.string()]).optional().nullable(),
  codigoCliente: z.string().optional(),
  fechaProgramada: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function TicketTabGeneral({ ticket, onUpdate, onSuccess }: TicketDetailTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tecnicos, setTecnicos] = useState<Empleado[]>([]);

  // Load tecnicos when editing
  useEffect(() => {
    if (isEditing) {
      loadTecnicos();
    }
  }, [isEditing]);

  const loadTecnicos = async () => {
    try {
      const res = await api.get('/empleados?limit=1000');
      setTecnicos(res.data.data || []);
    } catch (error) {
      console.error('Error loading tecnicos:', error);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      descripcion: ticket.descripcion,
      rubro: ticket.rubro,
      tipoTicket: ticket.tipoTicket,
      tecnicoId: ticket.tecnicoId || '',
      codigoCliente: ticket.codigoCliente || '',
      fechaProgramada: ticket.fechaProgramada
        ? new Date(ticket.fechaProgramada).toISOString().split('T')[0]
        : '',
    },
  });

  const handleStartEdit = () => {
    reset({
      descripcion: ticket.descripcion,
      rubro: ticket.rubro,
      tipoTicket: ticket.tipoTicket,
      tecnicoId: ticket.tecnicoId || '',
      codigoCliente: ticket.codigoCliente || '',
      fechaProgramada: ticket.fechaProgramada
        ? new Date(ticket.fechaProgramada).toISOString().split('T')[0]
        : '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const onSubmit = async (values: EditFormValues) => {
    try {
      setIsSaving(true);
      await api.patch(`/tickets/${ticket.id}`, {
        descripcion: values.descripcion,
        rubro: values.rubro,
        tipoTicket: values.tipoTicket,
        tecnicoId: values.tecnicoId ? Number(values.tecnicoId) : null,
        codigoCliente: values.codigoCliente || null,
        fechaProgramada: values.fechaProgramada
          ? new Date(values.fechaProgramada).toISOString()
          : null,
      });
      toast.success('Ticket actualizado');
      setIsEditing(false);
      onUpdate();
      onSuccess();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Error al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Editar Ticket
          </h3>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Descripción *
          </label>
          <textarea
            {...register('descripcion')}
            rows={3}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand resize-none"
          />
          {errors.descripcion && (
            <p className="text-xs text-red-500">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Rubro y Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="rubro"
            render={({ field }) => (
              <Select
                label="Rubro"
                options={Object.entries(RUBRO_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v as string,
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="tipoTicket"
            render={({ field }) => (
              <Select
                label="Tipo (SLA)"
                options={Object.entries(TIPO_TICKET_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v as string,
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Técnico */}
        <Controller
          control={control}
          name="tecnicoId"
          render={({ field }) => (
            <Select
              label="Técnico Asignado"
              options={[
                { value: '', label: 'Sin asignar' },
                ...tecnicos.map((t) => ({
                  value: t.id.toString(),
                  label: `${t.nombre} ${t.apellido}`,
                })),
              ]}
              value={field.value?.toString() || ''}
              onChange={field.onChange}
            />
          )}
        />

        {/* Código Cliente y Fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              N° Ticket Externo
            </label>
            <input
              type="text"
              {...register('codigoCliente')}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fecha Programada
            </label>
            <input
              type="date"
              {...register('fechaProgramada')}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Info de solo lectura */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cliente
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {ticket.sucursal?.cliente?.razonSocial || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sucursal
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {ticket.sucursal?.nombre || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fecha Creación
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {formatDate(ticket.fechaCreacion)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="ghost" onClick={handleCancelEdit}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
            Guardar
          </Button>
        </div>
      </form>
    );
  }

  // Read-only view
  return (
    <div className="space-y-6">
      {/* Header con botón editar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Información del Ticket
        </h3>
        {ticket.estado !== 'FINALIZADO' && ticket.estado !== 'CANCELADO' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            leftIcon={<Edit2 className="h-4 w-4" />}
          >
            Editar
          </Button>
        )}
      </div>

      {/* Descripción */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Descripción
        </label>
        <p className="mt-1 text-slate-900 dark:text-white whitespace-pre-wrap">
          {ticket.descripcion}
        </p>
      </div>

      {/* Grid de info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Rubro
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {RUBRO_LABELS[ticket.rubro]}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tipo (SLA)
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {TIPO_TICKET_LABELS[ticket.tipoTicket]}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sucursal
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ticket.sucursal?.nombre || '-'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Cliente
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ticket.sucursal?.cliente?.razonSocial || '-'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            N° Ticket Externo
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">
            {ticket.codigoCliente || '-'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Técnico
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {ticket.tecnico ? `${ticket.tecnico.nombre} ${ticket.tecnico.apellido}` : 'Sin asignar'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Fecha Creación
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {formatDate(ticket.fechaCreacion)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Fecha Programada
          </label>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {formatDate(ticket.fechaProgramada)}
          </p>
        </div>
      </div>
    </div>
  );
}
