export interface Sede {
    id: number;
    codigoInterno: number;
    codigoExterno: string | null;
    clienteId: number;
    zonaId: number;
    nombre: string;
    direccion: string;
    telefono: string | null;
    contactoNombre: string | null;
    contactoTelefono: string | null;
    fechaCreacion: string;
    fechaActualizacion: string;
    fechaEliminacion: string | null;

    // Relaciones enriquecidas de la API
    cliente?: {
        razonSocial: string;
    };
    zona?: {
        nombre: string;
    };
}

export interface SedeFormData {
    clienteId: number;
    zonaId: number;
    nombre: string;
    direccion: string;
    telefono?: string;
    contactoNombre?: string;
    contactoTelefono?: string;
    codigoExterno?: string;
}
