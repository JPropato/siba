export interface Zona {
    id: number;
    codigo: number;
    nombre: string;
    descripcion: string | null;
    fechaCreacion: string;
    fechaEliminacion: string | null;
}

export interface ZonaFormData {
    nombre: string;
    descripcion?: string;
}
