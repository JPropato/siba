export interface Role {
    id: number;
    nombre: string;
    description?: string;
}

export interface User {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    roles: string[]; // Simplificado: array de nombres de roles
    ultimoAcceso?: string;
    fechaCreacion: string;
    fechaEliminacion?: string | null;
}
