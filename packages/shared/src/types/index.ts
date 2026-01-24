// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// User types
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  createdAt: string;
  updatedAt: string;
}

// Role types
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
}
