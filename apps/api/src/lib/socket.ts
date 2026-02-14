import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';

interface ChatUser {
  id: number;
  email: string;
  roles: string[];
  permisos: string[];
}

interface ChatSocket extends Socket {
  data: {
    user: ChatUser;
  };
}

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Same CORS logic as Express - allow all configured origins
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:5176',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:5175',
          'http://ntb086:5173',
          'http://ntb086:5174',
          'http://ntb086:5175',
          'http://ntb086:5176',
          'https://siba-dev.julianpropato.com.ar',
          'https://siba-qas.bauman.com.ar',
          'https://siba.bauman.com.ar',
          ...(process.env.CORS_ORIGINS?.split(',') || []),
        ].filter(Boolean);
        callback(null, allowedOrigins.includes(origin));
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  // Auth middleware - validate JWT on connection
  const chatNs = io.of('/chat');

  chatNs.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token no proporcionado'));
    }

    const JWT_SECRET = process.env.JWT_SECRET!;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as ChatUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Token invalido o expirado'));
    }
  });

  chatNs.on('connection', async (socket: ChatSocket) => {
    const user = socket.data.user;
    console.log(`[Chat] User ${user.email} connected (socket: ${socket.id})`);

    // Join user to all their conversation rooms
    try {
      const participaciones = await prisma.participante.findMany({
        where: { usuarioId: user.id },
        select: { conversacionId: true },
      });

      for (const p of participaciones) {
        socket.join(`conv:${p.conversacionId}`);
      }
    } catch (err) {
      console.error('[Chat] Error loading user conversations:', err);
    }

    // --- Event handlers ---

    // Join a specific conversation room
    socket.on('join-conversation', (conversationId: number) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave-conversation', (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Mark conversation as read
    socket.on('mark-read', async (conversationId: number) => {
      try {
        await prisma.participante.updateMany({
          where: { conversacionId: conversationId, usuarioId: user.id },
          data: { ultimoLeido: new Date() },
        });
      } catch (err) {
        console.error('[Chat] Error marking as read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Chat] User ${user.email} disconnected`);
    });
  });

  console.log('[Chat] Socket.io initialized on namespace /chat');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function getChatNamespace() {
  return getIO().of('/chat');
}
