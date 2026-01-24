export interface Permission {
    id: number;
    codigo: string;
    descripcion: string | null;
    modulo: string;
}

export interface Role {
    id: number;
    nombre: string;
    descripcion: string | null;
    fechaCreacion: string;
    usuariosCount?: number;
    permisos: Permission[];
}

export interface PermissionsGrouped {
    permisos: Permission[];
    grouped: Record<string, Permission[]>;
}
