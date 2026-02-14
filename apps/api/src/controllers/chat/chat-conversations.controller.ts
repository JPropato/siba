import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { createConversationSchema } from '../../validators/chat.validators.js';
import { z } from 'zod';

/**
 * GET /chat/conversations
 * Returns user's conversations with last message preview and unread count
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const participaciones = await prisma.participante.findMany({
      where: { usuarioId: userId },
      include: {
        conversacion: {
          include: {
            participantes: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
              },
            },
            mensajes: {
              take: 1,
              orderBy: { fechaCreacion: 'desc' },
              where: { fechaEliminacion: null },
              include: {
                autor: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversacion: {
          ultimoMensajeAt: 'desc',
        },
      },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      participaciones.map(async (p) => {
        const unreadCount = await prisma.mensaje.count({
          where: {
            conversacionId: p.conversacionId,
            fechaEliminacion: null,
            fechaCreacion: {
              gt: p.ultimoLeido || new Date(0), // If never read, compare to epoch
            },
            autorId: { not: userId }, // Don't count own messages
          },
        });

        return {
          ...p.conversacion,
          ultimoMensaje: p.conversacion.mensajes[0] || null,
          unreadCount,
          participantRole: p.rol,
        };
      })
    );

    res.json({
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

/**
 * POST /chat/conversations
 * Create a new conversation (DIRECTA or GRUPAL)
 * For DIRECTA: check if 1:1 conversation already exists
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = createConversationSchema.parse(req.body);

    // Validate tipo-specific requirements
    if (body.tipo === 'GRUPAL' && !body.nombre) {
      return res.status(400).json({
        error: 'El nombre es requerido para conversaciones grupales',
      });
    }

    if (body.tipo === 'DIRECTA' && body.participantIds.length !== 1) {
      return res.status(400).json({
        error: 'Una conversación directa requiere exactamente 1 participante (además del creador)',
      });
    }

    // For DIRECTA: check if conversation already exists between these 2 users
    if (body.tipo === 'DIRECTA') {
      const otherUserId = body.participantIds[0];

      // Find existing DIRECTA conversation between these two users
      const existingConversation = await prisma.conversacion.findFirst({
        where: {
          tipo: 'DIRECTA',
          participantes: {
            every: {
              usuarioId: { in: [userId, otherUserId] },
            },
          },
        },
        include: {
          participantes: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                },
              },
            },
          },
          mensajes: {
            take: 1,
            orderBy: { fechaCreacion: 'desc' },
            where: { fechaEliminacion: null },
          },
        },
      });

      // Verify this is truly a 1:1 match (both users and only those two)
      if (
        existingConversation &&
        existingConversation.participantes.length === 2 &&
        existingConversation.participantes.every((p) => [userId, otherUserId].includes(p.usuarioId))
      ) {
        return res.json({
          data: {
            ...existingConversation,
            ultimoMensaje: existingConversation.mensajes[0] || null,
            unreadCount: 0, // Could calculate if needed
          },
        });
      }
    }

    // Verify all participant IDs exist
    const users = await prisma.usuario.findMany({
      where: { id: { in: body.participantIds } },
      select: { id: true },
    });

    if (users.length !== body.participantIds.length) {
      return res.status(400).json({
        error: 'Uno o más participantes no existen',
      });
    }

    // Create conversation with all participants (including creator)
    const conversation = await prisma.conversacion.create({
      data: {
        tipo: body.tipo,
        nombre: body.nombre,
        creadoPorId: userId,
        participantes: {
          create: [
            // Creator as ADMIN
            {
              usuarioId: userId,
              rol: 'ADMIN',
            },
            // Other participants as MIEMBRO
            ...body.participantIds.map((id) => ({
              usuarioId: id,
              rol: 'MIEMBRO' as const,
            })),
          ],
        },
      },
      include: {
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      data: {
        ...conversation,
        ultimoMensaje: null,
        unreadCount: 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear conversación:', error);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
};

/**
 * GET /chat/conversations/:id
 * Get conversation detail with all participants
 */
export const getConversationDetail = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user!.id;

    // Verify user is participant (security check)
    const participation = await prisma.participante.findFirst({
      where: {
        conversacionId: conversationId,
        usuarioId: userId,
      },
    });

    if (!participation) {
      return res.status(403).json({
        error: 'No tienes acceso a esta conversación',
      });
    }

    const conversation = await prisma.conversacion.findUnique({
      where: { id: conversationId },
      include: {
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    res.json({ data: conversation });
  } catch (error) {
    console.error('Error al obtener detalle de conversación:', error);
    res.status(500).json({ error: 'Error al obtener detalle de conversación' });
  }
};
