export interface ChatUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export interface ChatParticipant {
  id: number;
  usuarioId: number;
  rol: 'ADMIN' | 'MIEMBRO';
  ultimoLeido: string | null;
  silenciado: boolean;
  usuario: ChatUser;
}

export interface ChatMessage {
  id: number;
  conversacionId: number;
  autorId: number;
  contenido: string;
  tipoContenido: 'TEXTO' | 'ARCHIVO' | 'SISTEMA';
  editado: boolean;
  fechaCreacion: string;
  fechaEdicion: string | null;
  autor: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

export interface ChatConversation {
  id: number;
  tipo: 'DIRECTA' | 'GRUPAL';
  nombre: string | null;
  ultimoMensajeAt: string | null;
  fechaCreacion: string;
  participantes: ChatParticipant[];
  ultimoMensaje?: ChatMessage | null;
  unreadCount?: number;
}
