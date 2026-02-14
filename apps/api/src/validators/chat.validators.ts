import { z } from 'zod';

export const createConversationSchema = z.object({
  tipo: z.enum(['DIRECTA', 'GRUPAL']),
  nombre: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.number().int().positive()).min(1),
});

const mencionSchema = z.object({
  entidadTipo: z.string().min(1),
  entidadId: z.number().int().positive(),
  textoDisplay: z.string().min(1).max(200),
});

export const sendMessageSchema = z.object({
  contenido: z.string().min(1).max(5000),
  menciones: z.array(mencionSchema).optional(),
});
