import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { auditMiddleware } from './middlewares/audit.middleware.js';

const app = express();
// Confiar en el proxy (Dokploy/Traefik) para detectar HTTPS correctamente
app.set('trust proxy', 1);

import { prisma } from './lib/prisma.js';
const PORT = process.env.API_PORT || 3001;

// Middleware logging (DEBUG)
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`
  );
  next();
});

app.use(helmet());

// CORS debe ir ANTES del rate limiter para que los preflight OPTIONS no se bloqueen
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
        // Local network (ntb086)
        'http://ntb086:5173',
        'http://ntb086:5174',
        'http://ntb086:5175',
        'http://ntb086:5176',
        'http://ntb086:3001',
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

// Rate limiting (después de CORS para no bloquear preflight OPTIONS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Máximo 500 requests por IP por ventana
  skip: (req) => req.method === 'OPTIONS', // No contar preflight CORS
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas peticiones desde esta IP. Intente de nuevo en 15 minutos.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de login fallidos. Intente de nuevo en 15 minutos.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', loginLimiter);

app.use(express.json());
app.use(cookieParser());

// Servir archivos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check (before routes so it is always reachable)
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

// Audit middleware (must be before routes to intercept responses)
app.use('/api', auditMiddleware);

// Rutas API
app.use('/api', routes);

// Catch-all para 404 en /api (ARCH-002: centralized not-found handler)
app.use('/api', notFoundHandler);

// ARCH-002: Centralized error handler (must be registered LAST)
app.use(errorHandler);

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
