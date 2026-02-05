import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { Ticket, RubroTicket, TipoTicket } from '../../types/tickets';
import { RUBRO_LABELS, TIPO_TICKET_LABELS, TIPO_TICKET_SLA } from '../../types/tickets';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '../ui/Sheet';
import { Button } from '../ui/core/Button';
import { Combobox } from '../ui/core/Combobox';

interface Cliente {
  id: number;
  razonSocial: string;
}
interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  codigoInterno?: number;
  clienteId: number;
  cliente?: { razonSocial: string };
}
interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
}

// Schema base sin refinamientos contextuales
const baseSchema = z.object({
  descripcion: z.string().min(3, 'La descripción es requerida'),
  rubro: z.enum([
    'CIVIL',
    'ELECTRICIDAD',
    'SANITARIOS',
    'VARIOS',
    'REFRIGERACION',
    'LIMPIEZA',
    'TERMINACIONES',
  ]),
  tipoTicket: z.enum(['SEA', 'SEP', 'SN']),
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  sucursalId: z.string().min(1, 'Debe seleccionar una sucursal'),
  tecnicoId: z.string().optional().or(z.literal('')),
  fechaProgramada: z.string().optional().or(z.literal('')),
  codigoCliente: z.string().optional().or(z.literal('')),
});

// Schema extendido solo para tipado inicial, la validación real se hace con refine o manual
type TicketFormValues = z.infer<typeof baseSchema>;

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticketId: number) => void;
  ticket?: Ticket | null;
}

export default function TicketDrawer({ isOpen, onClose, onSuccess, ticket }: TicketDrawerProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [tecnicos, setTecnicos] = useState<Empleado[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      descripcion: '',
      rubro: 'VARIOS',
      tipoTicket: 'SN', // Default SN (Solicitud Normal)
      clienteId: '',
      sucursalId: '',
      tecnicoId: '',
      fechaProgramada: '',
      codigoCliente: '',
    },
  });

  const clienteId = watch('clienteId');
  const sucursalId = watch('sucursalId');
  const tipoTicketValue = watch('tipoTicket');

  // Detectar si el cliente es Correo Argentino
  const isCorreoArgentino = useMemo(() => {
    if (!clienteId) return false;
    const cliente = clientes.find((c) => c.id.toString() === clienteId);
    return cliente?.razonSocial?.toLowerCase().includes('correo') || false;
  }, [clienteId, clientes]);

  // Si es correo, validar codigoCliente
  const validateCorreo = (data: TicketFormValues) => {
    if (isCorreoArgentino && !data.codigoCliente) {
      setError('codigoCliente', {
        type: 'manual',
        message: 'El número de ticket externo es obligatorio para Correo Argentino',
      });
      return false;
    }
    clearErrors('codigoCliente');
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      setIsFetching(true);
      Promise.all([
        api.get('/clients?limit=100'),
        api.get('/sedes?limit=500'),
        api.get('/empleados?tipo=TECNICO&limit=100'),
      ])
        .then(([clientesRes, sedesRes, empleadosRes]) => {
          const clientesList: Cliente[] = clientesRes.data.data || [];
          setClientes(clientesList);
          setSucursales(sedesRes.data.data || []);
          setTecnicos(empleadosRes.data.data || []);

          // Find Correo Argentino client for default
          const correoCliente = clientesList.find((c) =>
            c.razonSocial?.toLowerCase().includes('correo')
          );

          if (ticket) {
            // Get clienteId from sucursal for editing
            const ticketSucursal = (sedesRes.data.data || []).find(
              (s: Sucursal) => s.id === ticket.sucursalId
            );
            reset({
              descripcion: ticket.descripcion,
              rubro: ticket.rubro as RubroTicket,
              tipoTicket: ticket.tipoTicket as TipoTicket,
              clienteId: ticketSucursal?.clienteId?.toString() || '',
              sucursalId: ticket.sucursalId.toString(),
              tecnicoId: ticket.tecnicoId?.toString() || '',
              fechaProgramada: ticket.fechaProgramada
                ? new Date(ticket.fechaProgramada).toISOString().split('T')[0]
                : '',
              codigoCliente: ticket.codigoCliente || '',
            });
          } else {
            // Default to Correo Argentino for new tickets
            reset({
              descripcion: '',
              rubro: 'VARIOS',
              tipoTicket: 'SN',
              clienteId: correoCliente?.id?.toString() || '',
              sucursalId: '',
              tecnicoId: '',
              fechaProgramada: '',
              codigoCliente: '',
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsFetching(false));
    }
  }, [isOpen, ticket, reset]);

  const onSubmit = async (values: TicketFormValues) => {
    if (!validateCorreo(values)) return;

    try {
      const data = {
        descripcion: values.descripcion.trim(),
        rubro: values.rubro,
        tipoTicket: values.tipoTicket,
        sucursalId: Number(values.sucursalId),
        tecnicoId: values.tecnicoId ? Number(values.tecnicoId) : null,
        fechaProgramada: values.fechaProgramada || null,
        codigoCliente: values.codigoCliente || null,
      };

      let ticketId: number;

      if (ticket) {
        const res = await api.patch(`/tickets/${ticket.id}`, data);
        ticketId = res.data.id;
        toast.success('Ticket actualizado');
      } else {
        const res = await api.post('/tickets', data);
        ticketId = res.data.id;
        toast.success('Ticket creado correctamente');
      }

      onSuccess(ticketId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const backendError = error.response?.data?.error;
      toast.error(backendError || 'Error al guardar el ticket.');
    }
  };

  // Client options for Combobox
  const clienteOptions = useMemo(() => {
    return clientes.map((c) => ({
      value: c.id.toString(),
      label: c.razonSocial,
    }));
  }, [clientes]);

  // Filter sucursales by selected client
  const sucursalOptions = useMemo(() => {
    const filtered = clienteId
      ? sucursales.filter((s) => s.clienteId?.toString() === clienteId)
      : sucursales;
    return filtered.map((s) => {
      const codigo = s.codigoInterno ? `[${s.codigoInterno}]` : '';
      const direccion = s.direccion ? ` - ${s.direccion}` : '';
      return {
        value: s.id.toString(),
        label: `${codigo} ${s.nombre}${direccion}`.trim(),
      };
    });
  }, [sucursales, clienteId]);

  // Clear sucursal when client changes
  useEffect(() => {
    if (clienteId) {
      // Check if current sucursal belongs to selected client
      const currentSucursal = sucursales.find((s) => s.id.toString() === sucursalId);
      if (currentSucursal && currentSucursal.clienteId?.toString() !== clienteId) {
        // Clear sucursal if it doesn't belong to the new client
        reset((prev) => ({ ...prev, sucursalId: '' }), { keepErrors: true });
      }
    }
  }, [clienteId, sucursales, sucursalId, reset]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" width="2xl">
        <SheetHeader>
          <SheetTitle>{ticket ? 'Editar Ticket' : 'Nuevo Ticket'}</SheetTitle>
          <SheetDescription>
            {ticket
              ? `Editando ticket TKT-${String(ticket.codigoInterno).padStart(5, '0')}`
              : 'Registre una nueva solicitud de servicio'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <form id="ticket-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Cliente con Buscador */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cliente *
              </label>
              <Controller
                control={control}
                name="clienteId"
                render={({ field }) => (
                  <Combobox
                    options={clienteOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar cliente..."
                    searchPlaceholder="Buscar por razón social..."
                    emptyText="No se encontraron clientes."
                    disabled={isFetching}
                  />
                )}
              />
              {errors.clienteId && (
                <p className="text-[11px] font-medium text-red-500">{errors.clienteId.message}</p>
              )}
              {isCorreoArgentino && (
                <p className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Cliente Correo Argentino - Ticket externo obligatorio
                </p>
              )}
            </div>

            {/* Sucursal con Buscador */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sucursal *
              </label>
              <Controller
                control={control}
                name="sucursalId"
                render={({ field }) => (
                  <Combobox
                    options={sucursalOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={clienteId ? 'Buscar sucursal...' : 'Primero seleccione un cliente'}
                    searchPlaceholder="Filtrar por nombre..."
                    emptyText={
                      clienteId ? 'No se encontraron sucursales.' : 'Seleccione un cliente primero.'
                    }
                    disabled={isFetching || !clienteId}
                  />
                )}
              />
              {errors.sucursalId && (
                <p className="text-[11px] font-medium text-red-500">{errors.sucursalId.message}</p>
              )}
            </div>

            {/* Código Cliente (Ticket Externo) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>N° Ticket Externo {isCorreoArgentino ? '*' : '(opcional)'}</span>
              </label>
              <input
                type="text"
                {...register('codigoCliente')}
                className={cn(
                  'w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white',
                  errors.codigoCliente
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-800'
                )}
                placeholder={isCorreoArgentino ? 'Requerido para Correo Arg.' : 'Ej: REQ-001234'}
              />
              {errors.codigoCliente && (
                <p className="text-[11px] font-medium text-red-500">
                  {errors.codigoCliente.message}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Descripción del Problema *
              </label>
              <textarea
                rows={4}
                {...register('descripcion')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none text-slate-900 dark:text-white"
                placeholder="Descripción detallada del problema..."
              />
              {errors.descripcion && (
                <p className="text-[11px] font-medium text-red-500">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Rubro y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rubro *
                </label>
                <select
                  {...register('rubro')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white"
                >
                  {Object.entries(RUBRO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v as string}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tipo de Ticket *
                </label>
                <select
                  {...register('tipoTicket')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white"
                >
                  {Object.entries(TIPO_TICKET_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SLA Info */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="material-symbols-outlined text-blue-500 text-[18px]">schedule</span>
              <span className="text-xs text-blue-700 dark:text-blue-300">
                <strong>SLA:</strong> {TIPO_TICKET_SLA[tipoTicketValue as TipoTicket]}
              </span>
            </div>

            {/* Técnico y Fecha Programada */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Técnico Asignado
                </label>
                <select
                  disabled={isFetching}
                  {...register('tecnicoId')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">Sin asignar</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fecha Programada
                </label>
                <input
                  type="date"
                  {...register('fechaProgramada')}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </form>
        </SheetBody>

        <SheetFooter className="gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="ticket-form"
            isLoading={isSubmitting}
            leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
          >
            {ticket ? 'Guardar Cambios' : 'Crear Ticket'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Utility para concatenar clases
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
