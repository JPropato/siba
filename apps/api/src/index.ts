import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import cookieParser from 'cookie-parser';
import routes from './routes/index.js';

// ... (imports anteriores)

const app = express();
// Confiar en el proxy (Dokploy/Traefik) para detectar HTTPS correctamente
app.set('trust proxy', 1);

export const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3001;

// Middleware logging (DEBUG)
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`
  );
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Si no hay origin (ej. Postman o server-to-server), permitir
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        // Local
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        // Dev
        'http://siba-dev-sibaweb-tfmrbz-e3ea43-148-230-79-241.traefik.me',
        'https://siba-dev.julianpropato.com.ar',
        'http://siba-dev.julianpropato.com.ar',
        'https://api-siba-dev.julianpropato.com.ar', // Por las dudas
        // Bauman QAS
        'https://siba-qas.bauman.com.ar',
        'http://siba-qas.bauman.com.ar',
        'https://api-siba-qas.bauman.com.ar',
        // Bauman PROD
        'https://siba.bauman.com.ar',
        'http://siba.bauman.com.ar',
        'https://api-siba.bauman.com.ar',
        // Env vars
        ...(process.env.CORS_ORIGINS?.split(',') || []),
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected Origin: ${origin}`);
        // En lugar de error, podemos pasar false para que cors responda con 403 o similar
        // pero 404 sigue siendo raro.
        callback(null, false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200, // Algunos browsers viejos necesitan esto
  })
);
app.use(express.json());
app.use(cookieParser());

// Servir archivos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rutas API
app.use('/api', routes);

// Catch-all para 404 en /api
app.use('/api', (req, res) => {
  console.log(`[404] Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` },
  });
});

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Database check failed:', error);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/', (_req, res) => {
  res.send('API Running');
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});

// Start server
const server = app.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);

  try {
    console.log('⏳ Connecting to Database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed at startup:', err);
  }
});

server.on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});

export { app };
