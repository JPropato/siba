import { useEffect, useState } from 'react';
import {
  Save,
  MapPin,
  Briefcase,
  UserCircle,
  Star,
  ShieldCheck,
  IdCard,
  Landmark,
  DollarSign,
  FileText,
  Heart,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '../../lib/api';
import { usePermissions } from '../../hooks/usePermissions';
import type {
  Empleado,
  EmpleadoFormData,
  TipoEmpleado,
  TipoContrato,
  CategoriaLaboral,
  EstadoCivil,
  EstadoPreocupacional,
  EstadoEmpleado,
} from '../../types/empleados';
import type { Zona } from '../../types/zona';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '../ui/Sheet';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { DatePicker } from '../ui/core/DatePicker';
import { ImageUpload } from '../ui/ImageUpload';

const empleadoSchema = z.object({
  // Datos personales
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  telefonoSecundario: z.string().optional().or(z.literal('')),
  direccion: z.string().optional().or(z.literal('')),
  cuil: z.string().optional().or(z.literal('')),
  dni: z.string().optional().or(z.literal('')),
  fechaNacimiento: z.string().optional().or(z.literal('')),
  estadoCivil: z.string().optional().or(z.literal('')),
  cantidadHijos: z.string().optional().or(z.literal('')),
  dniBeneficiario: z.string().optional().or(z.literal('')),
  foto: z.string().optional().or(z.literal('')),

  // Datos laborales
  inicioRelacionLaboral: z.string().min(1, 'La fecha de inicio es requerida'),
  tipo: z.enum(['TECNICO', 'ADMINISTRATIVO', 'GERENTE']),
  tipoContrato: z.string().optional().or(z.literal('')),
  legajo: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
  categoriaLaboral: z.string().optional().or(z.literal('')),
  convenioSeccion: z.string().optional().or(z.literal('')),
  puesto: z.string().optional().or(z.literal('')),
  lugarTrabajo: z.string().optional().or(z.literal('')),
  horario: z.string().optional().or(z.literal('')),
  esReferente: z.boolean(),
  ieric: z.boolean(),
  obraSocial: z.string().optional().or(z.literal('')),
  zonaId: z.string().optional().or(z.literal('')),
  fechaBaja: z.string().optional().or(z.literal('')),
  motivoBaja: z.string().optional().or(z.literal('')),

  // Datos bancarios
  banco: z.string().optional().or(z.literal('')),
  cbu: z.string().optional().or(z.literal('')),
  estadoBanco: z.string().optional().or(z.literal('')),

  // Datos salariales
  sueldoBruto: z.string().optional().or(z.literal('')),
  sueldoNeto: z.string().optional().or(z.literal('')),

  // Documentación
  preocupacionalEstado: z.string().optional().or(z.literal('')),
  preocupacionalFecha: z.string().optional().or(z.literal('')),
  fechaVencimientoSeguro: z.string().optional().or(z.literal('')),
  fechaVencimientoRegistro: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
});

type EmpleadoFormValues = z.infer<typeof empleadoSchema>;

interface EmpleadoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EmpleadoFormData) => Promise<void>;
  initialData?: Empleado | null;
}

function toDateStr(d: string | null | undefined): string {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// --- Tabs ---
type TabId = 'personal' | 'laboral' | 'bancario' | 'salario' | 'docs';

export default function EmpleadoDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EmpleadoDialogProps) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isFetchingZonas, setIsFetchingZonas] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const { hasPermission } = usePermissions();
  const canViewSalary = hasPermission('empleados:salarios');

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormValues>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: getDefaults(),
  });

  const estadoValue = watch('estado');
  const showBajaFields = estadoValue === 'BAJA' || estadoValue === 'RENUNCIA';

  const tabs: { id: TabId; label: string; icon: typeof UserCircle }[] = [
    { id: 'personal', label: 'Personal', icon: UserCircle },
    { id: 'laboral', label: 'Laboral', icon: Briefcase },
    { id: 'bancario', label: 'Bancario', icon: Landmark },
    ...(canViewSalary ? [{ id: 'salario' as TabId, label: 'Salario', icon: DollarSign }] : []),
    { id: 'docs', label: 'Docs', icon: FileText },
  ];

  useEffect(() => {
    if (isOpen) {
      setActiveTab('personal');
      const fetchZonas = async () => {
        setIsFetchingZonas(true);
        try {
          const res = await api.get('/zones?limit=100');
          setZonas(res.data.data || []);
        } catch (err) {
          console.error('Error fetching zones:', err);
        } finally {
          setIsFetchingZonas(false);
        }
      };
      fetchZonas();

      if (initialData) {
        reset({
          nombre: initialData.nombre,
          apellido: initialData.apellido,
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          telefonoSecundario: initialData.telefonoSecundario || '',
          direccion: initialData.direccion || '',
          cuil: initialData.cuil || '',
          dni: initialData.dni || '',
          fechaNacimiento: toDateStr(initialData.fechaNacimiento),
          estadoCivil: initialData.estadoCivil || '',
          cantidadHijos: initialData.cantidadHijos?.toString() || '',
          dniBeneficiario: initialData.dniBeneficiario || '',
          foto: initialData.foto || '',
          inicioRelacionLaboral: toDateStr(initialData.inicioRelacionLaboral),
          tipo: initialData.tipo,
          tipoContrato: initialData.tipoContrato || '',
          legajo: initialData.legajo || '',
          estado: initialData.estado || 'ACTIVO',
          categoriaLaboral: initialData.categoriaLaboral || '',
          convenioSeccion: initialData.convenioSeccion || '',
          puesto: initialData.puesto || '',
          lugarTrabajo: initialData.lugarTrabajo || '',
          horario: initialData.horario || '',
          esReferente: initialData.esReferente || false,
          ieric: initialData.ieric || false,
          obraSocial: initialData.obraSocial || '',
          zonaId: initialData.zonaId?.toString() || '',
          fechaBaja: toDateStr(initialData.fechaBaja),
          motivoBaja: initialData.motivoBaja || '',
          banco: initialData.banco || '',
          cbu: initialData.cbu || '',
          estadoBanco: initialData.estadoBanco || '',
          sueldoBruto: initialData.sueldoBruto?.toString() || '',
          sueldoNeto: initialData.sueldoNeto?.toString() || '',
          preocupacionalEstado: initialData.preocupacionalEstado || '',
          preocupacionalFecha: toDateStr(initialData.preocupacionalFecha),
          fechaVencimientoSeguro: toDateStr(initialData.fechaVencimientoSeguro),
          fechaVencimientoRegistro: toDateStr(initialData.fechaVencimientoRegistro),
          notas: initialData.notas || '',
        });
      } else {
        reset(getDefaults());
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: EmpleadoFormValues) => {
    try {
      const data: EmpleadoFormData = {
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email?.trim() || null,
        telefono: values.telefono?.trim() || null,
        telefonoSecundario: values.telefonoSecundario?.trim() || null,
        direccion: values.direccion?.trim() || null,
        cuil: values.cuil?.trim() || null,
        dni: values.dni?.trim() || null,
        fechaNacimiento: values.fechaNacimiento
          ? new Date(values.fechaNacimiento).toISOString()
          : null,
        estadoCivil: (values.estadoCivil as EstadoCivil) || null,
        cantidadHijos: values.cantidadHijos ? Number(values.cantidadHijos) : null,
        dniBeneficiario: values.dniBeneficiario?.trim() || null,
        foto: values.foto?.trim() || null,
        inicioRelacionLaboral: new Date(values.inicioRelacionLaboral).toISOString(),
        tipo: values.tipo as TipoEmpleado,
        tipoContrato: (values.tipoContrato as TipoContrato) || null,
        legajo: values.legajo?.trim() || null,
        estado: (values.estado as EstadoEmpleado) || 'ACTIVO',
        categoriaLaboral: (values.categoriaLaboral as CategoriaLaboral) || null,
        convenioSeccion: values.convenioSeccion?.trim() || null,
        puesto: values.puesto?.trim() || null,
        lugarTrabajo: values.lugarTrabajo?.trim() || null,
        horario: values.horario?.trim() || null,
        esReferente: values.esReferente || false,
        ieric: values.ieric || false,
        obraSocial: values.obraSocial?.trim() || null,
        zonaId: values.zonaId ? Number(values.zonaId) : null,
        fechaBaja: values.fechaBaja ? new Date(values.fechaBaja).toISOString() : null,
        motivoBaja: values.motivoBaja?.trim() || null,
        banco: values.banco?.trim() || null,
        cbu: values.cbu?.trim() || null,
        estadoBanco: values.estadoBanco?.trim() || null,
        preocupacionalEstado: (values.preocupacionalEstado as EstadoPreocupacional) || null,
        preocupacionalFecha: values.preocupacionalFecha
          ? new Date(values.preocupacionalFecha).toISOString()
          : null,
        fechaVencimientoSeguro: values.fechaVencimientoSeguro
          ? new Date(values.fechaVencimientoSeguro).toISOString()
          : null,
        fechaVencimientoRegistro: values.fechaVencimientoRegistro
          ? new Date(values.fechaVencimientoRegistro).toISOString()
          : null,
        notas: values.notas?.trim() || null,
      };

      if (canViewSalary) {
        data.sueldoBruto = values.sueldoBruto ? Number(values.sueldoBruto) : null;
        data.sueldoNeto = values.sueldoNeto ? Number(values.sueldoNeto) : null;
      }

      await onSave(data);
      toast.success(initialData ? 'Empleado actualizado' : 'Empleado creado correctamente');
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string | string[] } } };
      const backendError = axiosErr.response?.data?.error;
      const message = Array.isArray(backendError)
        ? backendError.join('. ')
        : backendError || 'Error al guardar el empleado.';
      toast.error(message);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" width="xl">
        <SheetHeader>
          <SheetTitle>{initialData ? 'Editar Empleado' : 'Nuevo Empleado'}</SheetTitle>
          <SheetDescription>Complete los datos del colaborador.</SheetDescription>
        </SheetHeader>

        {/* Tabs - underline style (convención Obras) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <SheetBody>
          <form id="empleado-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Tab: Personal ── */}
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Controller
                  name="foto"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      label="Foto"
                      value={field.value || null}
                      onChange={(url) => field.onChange(url || '')}
                    />
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    placeholder="Juan"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                  />
                  <Input
                    label="Apellido *"
                    placeholder="Pérez"
                    {...register('apellido')}
                    error={errors.apellido?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="CUIL" placeholder="20-12345678-9" {...register('cuil')} />
                  <Input label="DNI" placeholder="12345678" {...register('dni')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jperez@empresa.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  <Input
                    label="Teléfono"
                    placeholder="+54 11 1234-5678"
                    {...register('telefono')}
                  />
                </div>
                <Input
                  label="Teléfono secundario"
                  placeholder="+54 11 8765-4321"
                  {...register('telefonoSecundario')}
                />
                <Input
                  label="Dirección"
                  placeholder="Av. Siempre Viva 123"
                  {...register('direccion')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="fechaNacimiento"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Fecha de nacimiento"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    name="estadoCivil"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Estado civil"
                        options={[
                          { value: 'SOLTERO', label: 'Soltero/a' },
                          { value: 'CASADO', label: 'Casado/a' },
                          { value: 'DIVORCIADO', label: 'Divorciado/a' },
                          { value: 'VIUDO', label: 'Viudo/a' },
                          { value: 'UNION_CONVIVENCIAL', label: 'Unión convivencial' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sin especificar"
                        icon={<Heart className="h-4 w-4" />}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cantidad de hijos"
                    type="number"
                    min="0"
                    {...register('cantidadHijos')}
                  />
                  <Input
                    label="DNI beneficiario"
                    placeholder="DNI familiar"
                    {...register('dniBeneficiario')}
                  />
                </div>
              </div>
            )}

            {/* ── Tab: Laboral ── */}
            {activeTab === 'laboral' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Input label="Legajo" placeholder="Ej: 001" {...register('legajo')} />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="inicioRelacionLaboral"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Inicio relación laboral *"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.inicioRelacionLaboral?.message}
                      />
                    )}
                  />
                  <Controller
                    name="zonaId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Zona"
                        options={zonas.map((z) => ({ value: z.id.toString(), label: z.nombre }))}
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isFetchingZonas}
                        placeholder="Sin asignar"
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Tipo *"
                        options={[
                          { value: 'TECNICO', label: 'Técnico' },
                          { value: 'ADMINISTRATIVO', label: 'Administrativo' },
                          { value: 'GERENTE', label: 'Gerente' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        icon={<UserCircle className="h-4 w-4" />}
                      />
                    )}
                  />
                  <Controller
                    name="tipoContrato"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Tipo contrato"
                        options={[
                          { value: 'RELACION_DEPENDENCIA', label: 'Rel. dependencia' },
                          { value: 'MONOTRIBUTO', label: 'Monotributo' },
                          { value: 'PASANTIA', label: 'Pasantía' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sin especificar"
                        icon={<Briefcase className="h-4 w-4" />}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="categoriaLaboral"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Categoría laboral"
                        options={[
                          { value: 'OFICIAL', label: 'Oficial' },
                          { value: 'MEDIO_OFICIAL', label: 'Medio oficial' },
                          { value: 'AYUDANTE', label: 'Ayudante' },
                          { value: 'ADMINISTRATIVO', label: 'Administrativo' },
                          { value: 'ENCARGADO', label: 'Encargado' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sin especificar"
                      />
                    )}
                  />
                  <Input
                    label="Sección convenio"
                    placeholder="Ej: UOCRA Sección 1"
                    {...register('convenioSeccion')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Puesto" placeholder="Ej: MOVIL CABA" {...register('puesto')} />
                  <Input
                    label="Lugar de trabajo"
                    placeholder="Ej: Sede Central"
                    {...register('lugarTrabajo')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Horario" placeholder="Ej: 8 a 17hs" {...register('horario')} />
                  <Input label="Obra social" placeholder="Ej: OSECAC" {...register('obraSocial')} />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('esReferente')}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand dark:border-slate-600 dark:bg-slate-800"
                    />
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Referente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('ieric')}
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand dark:border-slate-600 dark:bg-slate-800"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">IERIC</span>
                  </label>
                </div>

                {/* Estado - solo visible al editar */}
                {initialData && (
                  <>
                    <Controller
                      name="estado"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="Estado"
                          options={[
                            { value: 'ACTIVO', label: 'Activo' },
                            { value: 'RENUNCIA', label: 'Renuncia' },
                            { value: 'BAJA', label: 'Baja' },
                            { value: 'LICENCIA', label: 'Licencia' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {showBajaFields && (
                      <div className="grid grid-cols-2 gap-4">
                        <Controller
                          name="fechaBaja"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              label="Fecha de baja"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        <Input
                          label="Motivo de baja"
                          placeholder="Motivo..."
                          {...register('motivoBaja')}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Bancario ── */}
            {activeTab === 'bancario' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Banco" placeholder="Ej: Santander" {...register('banco')} />
                  <Input label="CBU" placeholder="0000000000000000000000" {...register('cbu')} />
                </div>
                <Input
                  label="Estado bancario"
                  placeholder="Ej: Cuenta activa"
                  {...register('estadoBanco')}
                />
              </div>
            )}

            {/* ── Tab: Salario (solo con permiso) ── */}
            {activeTab === 'salario' && canViewSalary && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Sueldo bruto"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('sueldoBruto')}
                  />
                  <Input
                    label="Sueldo neto"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('sueldoNeto')}
                  />
                </div>
              </div>
            )}

            {/* ── Tab: Documentación ── */}
            {activeTab === 'docs' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="preocupacionalEstado"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Preocupacional"
                        options={[
                          { value: 'PENDIENTE', label: 'Pendiente' },
                          { value: 'APTO', label: 'Apto' },
                          { value: 'NO_APTO', label: 'No apto' },
                          { value: 'VENCIDO', label: 'Vencido' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sin especificar"
                      />
                    )}
                  />
                  <Controller
                    name="preocupacionalFecha"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Fecha preocupacional"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="fechaVencimientoSeguro"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Vto. Seguro"
                        value={field.value}
                        onChange={field.onChange}
                        icon={<ShieldCheck className="h-4 w-4" />}
                      />
                    )}
                  />
                  <Controller
                    name="fechaVencimientoRegistro"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Vto. Registro"
                        value={field.value}
                        onChange={field.onChange}
                        icon={<IdCard className="h-4 w-4" />}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    {...register('notas')}
                    rows={3}
                    placeholder="Observaciones, datos adicionales..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}
          </form>
        </SheetBody>

        <SheetFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="empleado-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-[18px] w-[18px]" />}
          >
            Guardar Empleado
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function getDefaults(): EmpleadoFormValues {
  return {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    telefonoSecundario: '',
    direccion: '',
    cuil: '',
    dni: '',
    fechaNacimiento: '',
    estadoCivil: '',
    cantidadHijos: '',
    dniBeneficiario: '',
    foto: '',
    inicioRelacionLaboral: '',
    tipo: 'TECNICO',
    tipoContrato: '',
    legajo: '',
    estado: 'ACTIVO',
    categoriaLaboral: '',
    convenioSeccion: '',
    puesto: '',
    lugarTrabajo: '',
    horario: '',
    esReferente: false,
    ieric: false,
    obraSocial: '',
    zonaId: '',
    fechaBaja: '',
    motivoBaja: '',
    banco: '',
    cbu: '',
    estadoBanco: '',
    sueldoBruto: '',
    sueldoNeto: '',
    preocupacionalEstado: '',
    preocupacionalFecha: '',
    fechaVencimientoSeguro: '',
    fechaVencimientoRegistro: '',
    notas: '',
  };
}
