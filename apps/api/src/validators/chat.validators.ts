import { z } from 'zod';

export const createConversationSchema = z.object({
  tipo: z.enum(['DIRECTA', 'GRUPAL']),
  nombre: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.number().int().positive()).min(1),
});

export const sendMessageSchema = z.object({
  contenido: z.string().min(1).max(5000),
});
