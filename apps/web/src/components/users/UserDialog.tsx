import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import type { User } from '../../types/user';
import api from '../../lib/api';
import { DialogBase } from '../ui/core/DialogBase';
import { Input } from '../ui/core/Input';
import { Button } from '../ui/core/Button';
import { Select } from '../ui/core/Select';
import { ShieldCheck, Save } from 'lucide-react';

interface Role { id: number; nombre: string; descripcion: string | null; }

interface UserFormData {
    nombre: string;
    apellido: string;
    email: string;
    password?: string;
    rolId: number;
}

const userSchema = z.object({
    nombre: z.string().min(2, 'El nombre es requerido'),
    apellido: z.string().min(2, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().optional().or(z.literal('')),
    rolId: z.string().min(1, 'Debe seleccionar un rol'),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UserFormData) => Promise<void>;
    initialData?: User | null;
}

export default function UserDialog({ isOpen, onClose, onSave, initialData }: UserDialogProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { nombre: '', apellido: '', email: '', password: '', rolId: '' },
    });

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const { data } = await api.get('/roles');
                setRoles(data);
            } catch (err) {
                console.error('Error fetching roles:', err);
            } finally {
                setLoadingRoles(false);
            }
        };
        if (isOpen) fetchRoles();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && roles.length > 0) {
            if (initialData) {
                const userRoleName = initialData.roles?.[0];
                const matchedRole = roles.find((r) => r.nombre === userRoleName);
                reset({
                    nombre: initialData.nombre,
                    apellido: initialData.apellido,
                    email: initialData.email,
                    password: '',
                    rolId: matchedRole?.id?.toString() || '',
                });
            } else {
                reset({ nombre: '', apellido: '', email: '', password: '', rolId: '' });
            }
        }
    }, [isOpen, initialData, roles, reset]);

    const onSubmit = async (values: UserFormValues) => {
        try {
            await onSave({
                nombre: values.nombre,
                apellido: values.apellido,
                email: values.email,
                password: values.password || undefined,
                rolId: Number(values.rolId),
            });
            toast.success(initialData ? 'Usuario actualizado' : 'Usuario creado correctamente');
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            toast.error(backendError || 'Error al guardar usuario');
        }
    };

    return (
        <DialogBase
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
            description="Gestione las credenciales de acceso."
            maxWidth="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="user-form"
                        isLoading={isSubmitting || loadingRoles}
                        leftIcon={<Save className="h-4 w-4" />}
                    >
                        Guardar
                    </Button>
                </>
            }
        >
            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Nombre *" {...register('nombre')} error={errors.nombre?.message} />
                    <Input label="Apellido *" {...register('apellido')} error={errors.apellido?.message} />
                </div>
                <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
                <Input
                    label={initialData ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
                    type="password"
                    {...register('password')}
                    error={errors.password?.message}
                />
                <Controller
                    name="rolId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            label="Rol *"
                            options={roles.map((r) => ({ value: r.id.toString(), label: r.nombre }))}
                            value={field.value}
                            onChange={field.onChange}
                            isLoading={loadingRoles}
                            placeholder="Seleccionar rol"
                            icon={<ShieldCheck className="h-4 w-4" />}
                            error={errors.rolId?.message}
                        />
                    )}
                />
            </form>
        </DialogBase>
    );
}
