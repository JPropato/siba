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
export const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      // Local development
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      // Dokploy dev domains (traefik.me)
      'http://siba-dev-sibaweb-tfmrbz-e3ea43-148-230-79-241.traefik.me',
      // Dominio personalizado DEV (julianpropato.com.ar)
      'https://siba-dev.julianpropato.com.ar',
      'http://siba-dev.julianpropato.com.ar',
      // UAT - Bauman QAS
      'https://siba-qas.bauman.com.ar',
      'http://siba-qas.bauman.com.ar',
      // PROD - Bauman
      'https://siba.bauman.com.ar',
      'http://siba.bauman.com.ar',
      // Variable de entorno para orígenes adicionales
      ...(process.env.CORS_ORIGINS?.split(',') || []),
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Servir archivos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rutas API
app.use('/api', routes);

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
