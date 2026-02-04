---
name: siba-security
description: Patrones de seguridad para APIs y frontend
---

# SIBA Security

Lineamientos para implementar seguridad en la aplicación.

## Cuándo Usar

- Configurar **headers de seguridad**
- Implementar **rate limiting**
- Sanitizar **inputs de usuario**
- Proteger contra **ataques comunes**

---

## Headers de Seguridad (Helmet)

```typescript
// index.ts
import helmet from 'helmet';

app.use(helmet());

// O con configuración específica
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
```

### Headers que Helmet configura

| Header                      | Propósito                     |
| --------------------------- | ----------------------------- |
| `X-Content-Type-Options`    | Previene MIME sniffing        |
| `X-Frame-Options`           | Previene clickjacking         |
| `X-XSS-Protection`          | Activa filtro XSS del browser |
| `Strict-Transport-Security` | Fuerza HTTPS                  |
| `Content-Security-Policy`   | Controla recursos cargados    |

---

## CORS Configuración

```typescript
// index.ts
import cors from 'cors';

const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://app.siba.com', 'https://admin.siba.com']
      : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

---

## Rate Limiting

```typescript
// middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

// Límite general
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: { error: 'Demasiadas solicitudes, intente más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite estricto para login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login
  message: { error: 'Demasiados intentos de login' },
  skipSuccessfulRequests: true,
});

// Uso
app.use('/api', generalLimiter);
app.use('/api/auth/login', loginLimiter);
```

---

## Sanitización de Inputs

```typescript
// Nunca confiar en input del usuario

// ✅ Validar con Zod
const userInput = createSchema.parse(req.body);

// ✅ Escapar HTML (si se renderiza)
import { escape } from 'html-escaper';
const safeHtml = escape(userInput.description);

// ✅ Sanitizar para SQL (Prisma lo hace automáticamente)
// Prisma usa prepared statements

// ❌ NUNCA hacer esto
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
```

---

## Protección contra Ataques

### SQL Injection

```typescript
// ✅ Prisma usa prepared statements automáticamente
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ NUNCA usar raw queries con input directo
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
// Prisma sanitiza esto, pero evitar si es posible
```

### XSS (Cross-Site Scripting)

```tsx
// React escapa automáticamente
<p>{userInput}</p> // ✅ Safe

// ❌ Peligroso
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Si necesitas HTML, sanitizar primero
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF (Cross-Site Request Forgery)

```typescript
// 1. Usar tokens CSRF
import csrf from 'csurf';
app.use(csrf({ cookie: true }));

// 2. O confiar en SameSite cookies (más simple)
res.cookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});
```

---

## Cookies Seguras

```typescript
// services/auth.service.ts
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: true, // No accesible desde JS
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS
    sameSite: 'strict', // Previene CSRF
    maxAge: 8 * 60 * 60 * 1000, // 8 horas
    path: '/',
  });
};
```

---

## Validación de Archivos

```typescript
// Validar tipo de archivo
const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];

const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Limitar tamaño
const upload = multer({
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Máximo 5 archivos
  },
});

// Validar por magic bytes (más seguro que extensión)
import fileType from 'file-type';

const validateFile = async (buffer: Buffer) => {
  const type = await fileType.fromBuffer(buffer);
  if (!type || !allowedMimes.includes(type.mime)) {
    throw new Error('Tipo de archivo inválido');
  }
};
```

---

## Secrets Management

```typescript
// ❌ NUNCA hardcodear secrets
const JWT_SECRET = 'mi-secret-hardcodeado';

// ✅ Usar variables de entorno
const JWT_SECRET = process.env.JWT_SECRET!;

// ✅ Validar que existan al iniciar
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

---

## Logging Seguro

```typescript
// ❌ No loguear datos sensibles
logger.info('Login', { email, password }); // NUNCA

// ✅ Loguear solo lo necesario
logger.info('Login attempt', { email });
logger.info('Login successful', { userId: user.id });
```

---

## Password Storage

```typescript
import bcrypt from 'bcryptjs';

// Hashear
const SALT_ROUNDS = 12; // Mínimo 10
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Comparar
const isValid = await bcrypt.compare(inputPassword, hashedPassword);

// ❌ NUNCA
// - Guardar passwords en texto plano
// - Usar MD5 o SHA1 sin salt
// - Usar menos de 10 rounds de bcrypt
```

---

## Checklist de Seguridad

### Backend

- [ ] Helmet configurado
- [ ] CORS restringido a dominios conocidos
- [ ] Rate limiting en API
- [ ] Rate limiting estricto en login
- [ ] Validación Zod en todos los endpoints
- [ ] Passwords hasheados con bcrypt (12 rounds)
- [ ] JWT con expiración corta (8h)
- [ ] No loguear datos sensibles

### Frontend

- [ ] No usar `dangerouslySetInnerHTML`
- [ ] Sanitizar si es necesario renderizar HTML
- [ ] Token en httpOnly cookie o memoria (no localStorage)
- [ ] Validar inputs antes de enviar

### Infraestructura

- [ ] HTTPS en producción
- [ ] Secrets en variables de entorno
- [ ] Backups encriptados
- [ ] Acceso a BD restringido
