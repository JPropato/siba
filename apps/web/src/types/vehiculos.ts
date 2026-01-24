export interface Vehiculo {
    id: number;
    codigoInterno: number;
    patente: string;
    marca: string | null;
    modelo: string | null;
    anio: number | null;
    tipo: string | null;
    zonaId: number | null;
    proximosKm: number | null;
    proximoService: string | null;
    estado: 'ACTIVO' | 'TALLER' | 'FUERA_SERVICIO';
    fechaCreacion: string;
    fechaActualizacion: string;
    fechaEliminacion: string | null;

    // Relaciones
    zona?: {
        nombre: string;
    };
}

export interface VehiculoFormData {
    patente: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    tipo?: string;
    zonaId?: number | null;
    proximosKm?: number;
    proximoService?: string | null;
    estado?: 'ACTIVO' | 'TALLER' | 'FUERA_SERVICIO';
}
