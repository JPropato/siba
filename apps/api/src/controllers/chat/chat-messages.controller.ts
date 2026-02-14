import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendMessageSchema } from '../../validators/chat.validators.js';
import { getChatNamespace } from '../../lib/socket.js';
import { z } from 'zod';

/**
 * GET /chat/conversations/:id/messages
 * Cursor-based pagination for messages
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user!.id;
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

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

    // Build cursor condition
    const cursorCondition = cursor
      ? {
          id: { lt: cursor }, // Get messages older than cursor
        }
      : {};

    const messages = await prisma.mensaje.findMany({
      where: {
        conversacionId: conversationId,
        fechaEliminacion: null,
        ...cursorCondition,
      },
      take: limit,
      orderBy: { fechaCreacion: 'desc' }, // Newest first
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    // Determine if there are more messages
    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    res.json({
      data: messages,
      meta: {
        nextCursor,
        hasMore,
        limit,
      },
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

/**
 * POST /chat/conversations/:id/messages
 * Send a new message
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user!.id;
    const body = sendMessageSchema.parse(req.body);

    // Verify user is participant
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

    // Create message and update conversation's ultimoMensajeAt in a transaction
    const [message, _] = await prisma.$transaction([
      prisma.mensaje.create({
        data: {
          conversacionId: conversationId,
          autorId: userId,
          contenido: body.contenido,
        },
        include: {
          autor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      }),
      prisma.conversacion.update({
        where: { id: conversationId },
        data: { ultimoMensajeAt: new Date() },
      }),
    ]);

    // Emit socket event to all users in the conversation room
    try {
      const chatNs = getChatNamespace();
      chatNs.to(`conv:${conversationId}`).emit('new-message', {
        conversacionId: conversationId,
        mensaje: message,
      });
    } catch (socketError) {
      // Don't fail the request if socket emission fails
      console.error('Error emitting socket event:', socketError);
    }

    res.status(201).json({ data: message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

/**
 * POST /chat/conversations/:id/read
 * Mark conversation as read (update ultimoLeido)
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user!.id;

    // Update participante's ultimoLeido
    const updated = await prisma.participante.updateMany({
      where: {
        conversacionId: conversationId,
        usuarioId: userId,
      },
      data: {
        ultimoLeido: new Date(),
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({
        error: 'No eres participante de esta conversación',
      });
    }

    res.json({ message: 'Conversación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ error: 'Error al marcar como leído' });
  }
};

/**
 * GET /chat/unread-count
 * Get total unread count across all conversations for current user
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all participations
    const participaciones = await prisma.participante.findMany({
      where: { usuarioId: userId },
      select: {
        conversacionId: true,
        ultimoLeido: true,
      },
    });

    // Calculate total unread across all conversations
    let totalUnread = 0;

    for (const p of participaciones) {
      const unreadCount = await prisma.mensaje.count({
        where: {
          conversacionId: p.conversacionId,
          fechaEliminacion: null,
          fechaCreacion: {
            gt: p.ultimoLeido || new Date(0),
          },
          autorId: { not: userId }, // Don't count own messages
        },
      });

      totalUnread += unreadCount;
    }

    res.json({
      data: {
        unreadCount: totalUnread,
      },
    });
  } catch (error) {
    console.error('Error al obtener contador de no leídos:', error);
    res.status(500).json({ error: 'Error al obtener contador de no leídos' });
  }
};
