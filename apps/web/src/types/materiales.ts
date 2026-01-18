export interface Material {
    id: number;
    codigoInterno: number;
    codigoArticulo: string;
    nombre: string;
    descripcion: string | null;
    presentacion: string;
    unidadMedida: string;
    categoria: string | null;
    stockMinimo: number | null;
    // Pricing
    precioCosto: string | number; // Decimal from Prisma comes as string in JSON usually
    precioVenta: string | number;
    porcentajeRentabilidad: number;

    fechaCreacion: string;
    fechaActualizacion: string;
    fechaEliminacion: string | null;
}

export interface MaterialFormData {
    codigoArticulo: string;
    nombre: string;
    descripcion?: string;
    presentacion: string;
    unidadMedida: string;
    categoria?: string;
    stockMinimo?: number;
    // Pricing
    precioCosto: number;
    porcentajeRentabilidad: number;
    precioVenta: number;
}

export interface HistorialPrecio {
    id: number;
    materialId: number;
    precioCosto: string | number;
    precioVenta: string | number;
    porcentajeRentabilidad: number;
    fechaCambio: string;
}
