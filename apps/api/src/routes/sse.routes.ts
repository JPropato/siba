import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ticketEventBus, TicketChangeEvent } from '../lib/ticket-events.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

router.get('/events', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('event: connected\ndata: ok\n\n');

  const onTicketChange = (data: TicketChangeEvent) => {
    const payload = JSON.stringify({
      action: data.action,
      ticketId: data.ticketId,
      timestamp: data.timestamp,
    });
    res.write(`event: ticket:change\ndata: ${payload}\n\n`);
  };

  ticketEventBus.on('ticket:change', onTicketChange);

  // Heartbeat cada 30s
  const heartbeat = setInterval(() => {
    res.write('event: heartbeat\ndata: ping\n\n');
  }, 30_000);

  req.on('close', () => {
    ticketEventBus.off('ticket:change', onTicketChange);
    clearInterval(heartbeat);
  });
});

export default router;
