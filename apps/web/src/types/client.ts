export interface Cliente {
    id: number;
    codigo: number;
    razonSocial: string;
    cuit: string | null;
    email: string | null;
    telefono: string | null;
    direccionFiscal: string | null;
    fechaCreacion: string;
    fechaActualizacion: string;
    fechaEliminacion: string | null;
}

export interface ClienteFormData {
    razonSocial: string;
    cuit?: string;
    email?: string;
    telefono?: string;
    direccionFiscal?: string;
}
