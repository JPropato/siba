import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, Info } from 'lucide-react';
import type { Role, PermissionsGrouped } from '../../types/role';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';

const roleSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  descripcion: z.string().optional().or(z.literal('')),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; descripcion: string; permisoIds: number[] }) => Promise<void>;
  role: Role | null;
  permissionsGrouped: PermissionsGrouped;
}

export default function RoleDialog({
  isOpen,
  onClose,
  onSave,
  role,
  permissionsGrouped,
}: RoleDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  useEffect(() => {
    if (role) {
      reset({ nombre: role.nombre, descripcion: role.descripcion || '' });
      setSelectedPermissions(role.permisos.map((p) => p.id));
    } else {
      reset({ nombre: '', descripcion: '' });
      setSelectedPermissions([]);
    }
  }, [role, isOpen, reset]);

  const onSubmit = async (values: RoleFormValues) => {
    try {
      await onSave({
        nombre: values.nombre,
        descripcion: values.descripcion || '',
        permisoIds: selectedPermissions,
      });
      toast.success(role ? 'Rol actualizado' : 'Rol creado correctamente');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(message);
    }
  };

  const togglePermission = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleModuleAll = (modulo: string) => {
    const modulePerms = permissionsGrouped.grouped[modulo] || [];
    const moduleIds = modulePerms.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...moduleIds])]);
    }
  };

  const isEditingSuperAdmin = role?.nombre === 'Super Admin';

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title={role ? 'Editar Rol' : 'Nuevo Rol'}
      description="Configure los permisos del rol."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="role-form"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {role ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Nombre del Rol *"
          placeholder="Ej: Vendedor, Gerente..."
          disabled={isEditingSuperAdmin}
          {...register('nombre')}
          error={errors.nombre?.message}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="descripcion-rol"
            className="text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            Descripción
          </label>
          <textarea
            id="descripcion-rol"
            {...register('descripcion')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-brand transition-all resize-none text-slate-900 dark:text-white"
            rows={2}
            placeholder="Descripción opcional del rol..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Permisos
          </label>
          {isEditingSuperAdmin && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>El rol Super Admin siempre tiene todos los permisos.</span>
            </div>
          )}
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {Object.entries(permissionsGrouped.grouped).map(([modulo, perms]) => {
              const moduleIds = perms.map((p) => p.id);
              const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));
              const someSelected = moduleIds.some((id) => selectedPermissions.includes(id));

              return (
                <div
                  key={modulo}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
                    onClick={() => !isEditingSuperAdmin && toggleModuleAll(modulo)}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={() => {}}
                      disabled={isEditingSuperAdmin}
                      className="size-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="font-medium text-slate-900 dark:text-white">{modulo}</span>
                    <span className="text-xs text-slate-400">({perms.length} permisos)</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id) || isEditingSuperAdmin}
                          onChange={() => togglePermission(perm.id)}
                          disabled={isEditingSuperAdmin}
                          className="size-4 mt-0.5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-brand">
                            {perm.codigo}
                          </p>
                          {perm.descripcion && (
                            <p className="text-xs text-slate-400">{perm.descripcion}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </DialogBase>
  );
}
