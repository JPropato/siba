# 🔴 Deudas Técnicas: Seguridad Crítica

> Vulnerabilidades que DEBEN resolverse antes de deployment a producción.

**Estado**: ✅ Todas resueltas (commit fac1a9a)
**Esfuerzo total**: ~2 horas
**Prioridad**: P0 - BLOQUEANTE (resuelto)

---

## 📊 Índice de Vulnerabilidades

| ID                                                       | Título                               | CVSS Score | Severidad  | Esfuerzo | Estado      |
| -------------------------------------------------------- | ------------------------------------ | ---------- | ---------- | -------- | ----------- |
| [SEC-001](#sec-001-jwt_secret-con-fallback-inseguro)     | JWT_SECRET con fallback inseguro     | 9.8        | 🔴 Crítico | 15 min   | ✅ Resuelto |
| [SEC-002](#sec-002-rutas-sin-autenticación)              | Rutas sin autenticación              | 9.1        | 🔴 Crítico | 30 min   | ✅ Resuelto |
| [SEC-003](#sec-003-sin-rate-limiting)                    | Sin rate limiting                    | 7.5        | 🔴 Alto    | 1 hora   | ✅ Resuelto |
| [SEC-004](#sec-004-bcrypt-rounds-insuficientes)          | Bcrypt rounds insuficientes          | 5.3        | 🟡 Medio   | 5 min    | ✅ Resuelto |
| [SEC-005](#sec-005-upload-sin-validación-de-magic-bytes) | Upload sin validación de magic bytes | 6.1        | 🟡 Medio   | 30 min   | ✅ Resuelto |

**Total**: 5 vulnerabilidades | ✅ Todas resueltas

---

## SEC-001: JWT_SECRET con Fallback Inseguro

### 📌 Descripción

El middleware de autenticación y el servicio de auth utilizan un valor por defecto para `JWT_SECRET` si la variable de entorno no está configurada. Esto permite a un atacante que conozca el secret por defecto generar tokens JWT válidos arbitrariamente, comprometiendo completamente el sistema de autenticación.

### 🎯 Ubicación

- **Archivo 1**: [apps/api/src/middlewares/auth.middleware.ts](../../apps/api/src/middlewares/auth.middleware.ts) línea 4
- **Archivo 2**: [apps/api/src/services/auth.service.ts](../../apps/api/src/services/auth.service.ts) líneas 6-7

### ⚠️ Impacto

- **CVSS 3.1 Score**: 9.8 (Crítico)
- **Vector**: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
- **Confidencialidad**: Alta (acceso a todos los datos de usuarios)
- **Integridad**: Alta (modificación de datos sin autorización)
- **Disponibilidad**: Alta (posible DoS mediante tokens maliciosos)

**Escenario de ataque**:

1. Atacante descubre que el sistema usa secret por defecto
2. Genera token JWT válido con rol de ADMIN
3. Accede a todos los endpoints protegidos
4. Extrae datos sensibles, modifica registros, elimina información

### 🐛 Código Vulnerable

```typescript
// ❌ VULNERABLE
// apps/api/src/middlewares/auth.middleware.ts
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

// apps/api/src/services/auth.service.ts
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
```

**Problemas**:

- Si `JWT_SECRET` no está en `.env`, usa 'default-secret'
- Secret débil y predecible
- Sin validación de longitud mínima
- No falla al inicio (fail silently)

### ✅ Solución

```typescript
// ✅ SEGURO
// apps/api/src/middlewares/auth.middleware.ts
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set');
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    `CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long (current: ${JWT_SECRET.length})`
  );
}

export { JWT_SECRET };
```

**Mejoras**:

- ✅ Sin valor por defecto
- ✅ Validación de existencia
- ✅ Validación de longitud mínima (32 caracteres)
- ✅ Error explícito que detiene la aplicación
- ✅ Fail-fast al startup

### 🧪 Testing

```bash
# Test 1: Sin JWT_SECRET debe fallar al iniciar
unset JWT_SECRET
npm run start:dev
# Esperado: Process exit con error
# "CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set"

# Test 2: Con JWT_SECRET corto debe fallar
export JWT_SECRET="abc123"
npm run start:dev
# Esperado: Process exit con error
# "CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long (current: 6)"

# Test 3: Con JWT_SECRET válido debe iniciar correctamente
export JWT_SECRET=$(openssl rand -base64 32)
npm run start:dev
# Esperado: Server started on port 3003 ✅

# Test 4: Verificar longitud del secret generado
echo $JWT_SECRET | wc -c
# Esperado: ≥ 32 caracteres
```

### 📚 Referencias

- **Fuente**: [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md) líneas 69-88
- **Skill**: [siba-security](../../.agent/skills/siba-security/SKILL.md)
- **OWASP**: [A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- **CWE**: [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)

### ✅ Checklist de Resolución

- [ ] Actualizar auth.middleware.ts con validación
- [ ] Actualizar auth.service.ts con validación
- [ ] Ejecutar tests de validación
- [ ] Generar JWT_SECRET seguro para todos los ambientes
- [ ] Actualizar .env.example con instrucciones
- [ ] Documentar en README cómo generar secret
- [ ] Code review aprobado
- [ ] Deploy a staging y verificar

---

## SEC-002: Rutas sin Autenticación

### 📌 Descripción

Múltiples endpoints de la API están expuestos públicamente sin middleware de autenticación, permitiendo acceso no autorizado a datos sensibles.

### 🎯 Ubicación

**Confirmadas sin auth**:

- [apps/api/src/routes/ticket.routes.ts](../../apps/api/src/routes/ticket.routes.ts) - TODAS las rutas
- [apps/api/src/routes/upload.routes.ts](../../apps/api/src/routes/upload.routes.ts) - TODAS las rutas

**Por verificar**:

- `apps/api/src/routes/empleado.routes.ts`
- `apps/api/src/routes/sedes.routes.ts`
- `apps/api/src/routes/zones.routes.ts`
- `apps/api/src/routes/vehiculos.routes.ts`
- `apps/api/src/routes/materials.routes.ts`

### ⚠️ Impacto

- **CVSS 3.1 Score**: 9.1 (Crítico)
- **Vector**: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
- **Exposición de datos**: Tickets, empleados, sedes, materiales, vehículos
- **Modificación no autorizada**: Cualquiera puede crear/modificar/eliminar

**Escenario de ataque**:

```bash
# Cualquier persona puede acceder sin autenticación
curl http://api.siba.com/api/tickets
# Retorna TODOS los tickets con datos sensibles

curl -X POST http://api.siba.com/api/tickets \
  -d '{"clienteId":1,"descripcion":"Ticket falso"}'
# Crea tickets arbitrarios

curl -X DELETE http://api.siba.com/api/tickets/123
# Elimina tickets sin autorización
```

### 🐛 Código Vulnerable

```typescript
// ❌ VULNERABLE
// apps/api/src/routes/ticket.routes.ts
import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';

const router = Router();

// ⚠️ Ninguna ruta protegida
router.get('/tickets', ticketController.getAll);
router.get('/tickets/:id', ticketController.getById);
router.post('/tickets', ticketController.create);
router.put('/tickets/:id', ticketController.update);
router.delete('/tickets/:id', ticketController.delete);

export default router;
```

### ✅ Solución

```typescript
// ✅ SEGURO - Opción 1: Proteger todas las rutas del router
import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar autenticación a TODAS las rutas de este router
router.use(authenticateToken);

router.get('/tickets', ticketController.getAll);
router.get('/tickets/:id', ticketController.getById);
router.post('/tickets', ticketController.create);
router.put('/tickets/:id', ticketController.update);
router.delete('/tickets/:id', ticketController.delete);

export default router;
```

```typescript
// ✅ SEGURO - Opción 2: Proteger selectivamente (si hay rutas públicas)
import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas
router.get('/tickets', authenticateToken, ticketController.getAll);
router.get('/tickets/:id', authenticateToken, ticketController.getById);
router.post('/tickets', authenticateToken, ticketController.create);
router.put('/tickets/:id', authenticateToken, ticketController.update);
router.delete('/tickets/:id', authenticateToken, ticketController.delete);

// Ruta pública (si aplica)
// router.get('/tickets/public/stats', ticketController.getPublicStats);

export default router;
```

### 🧪 Testing

```bash
# Test 1: Sin token debe retornar 401 Unauthorized
curl -i http://localhost:3003/api/tickets
# Esperado: HTTP/1.1 401 Unauthorized
# {"error": {"code": "UNAUTHORIZED", "message": "Access token required"}}

# Test 2: Con token inválido debe retornar 403 Forbidden
curl -i -H "Authorization: Bearer token-invalido" http://localhost:3003/api/tickets
# Esperado: HTTP/1.1 403 Forbidden
# {"error": {"code": "FORBIDDEN", "message": "Invalid or expired token"}}

# Test 3: Con token válido debe retornar datos
TOKEN="<token-válido-del-login>"
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:3003/api/tickets
# Esperado: HTTP/1.1 200 OK
# {"data": [...], "total": 10}

# Test 4: Verificar TODAS las rutas de tickets
for method in GET POST PUT DELETE; do
  curl -i -X $method http://localhost:3003/api/tickets/1
done
# Esperado: TODAS deben retornar 401 sin token
```

### 📚 Referencias

- **Fuente**: [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md) líneas 89-110
- **Skill**: [siba-auth](../../.agent/skills/siba-auth/SKILL.md)
- **OWASP**: [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **CWE**: [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)

### ✅ Checklist de Resolución

- [ ] Agregar `authenticateToken` a ticket.routes.ts
- [ ] Agregar `authenticateToken` a upload.routes.ts
- [ ] Auditar y proteger empleado.routes.ts
- [ ] Auditar y proteger sedes.routes.ts
- [ ] Auditar y proteger zones.routes.ts
- [ ] Auditar y proteger vehiculos.routes.ts
- [ ] Auditar y proteger materials.routes.ts
- [ ] Ejecutar tests de autenticación en todas las rutas
- [ ] Code review aprobado
- [ ] Verificar en staging que frontend sigue funcionando

---

## SEC-003: Sin Rate Limiting

### 📌 Descripción

La API no implementa rate limiting, permitiendo ataques de fuerza bruta, DoS (Denial of Service) y abuso de recursos.

### 🎯 Ubicación

- [apps/api/src/index.ts](../../apps/api/src/index.ts) - Falta middleware de rate limiting

### ⚠️ Impacto

- **CVSS 3.1 Score**: 7.5 (Alto)
- **Ataques de fuerza bruta** en login (probar miles de contraseñas)
- **DoS** mediante requests masivos
- **Abuso de recursos** (CPU, memoria, BD)
- **Scraping** de datos sin limitaciones

**Escenario de ataque**:

```bash
# Ataque de fuerza bruta en login
for i in {1..10000}; do
  curl -X POST http://api.siba.com/api/auth/login \
    -d "{\"email\":\"admin@siba.com\",\"password\":\"pass$i\"}"
done
# Sin rate limiting, el atacante puede probar 10,000 contraseñas en minutos
```

### 🐛 Código Vulnerable

```typescript
// ❌ VULNERABLE
// apps/api/src/index.ts
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());

// ⚠️ Falta rate limiting

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
```

### ✅ Solución

```typescript
// ✅ SEGURO
import rateLimit from 'express-rate-limit';

// Rate limiter global (todas las rutas)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP por ventana
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas peticiones desde esta IP. Intente de nuevo en 15 minutos.',
    },
  },
  standardHeaders: true, // Retorna RateLimit-* headers
  legacyHeaders: false, // Desactiva X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    });
  },
});

// Rate limiter estricto para login (previene brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login por IP
  skipSuccessfulRequests: true, // No cuenta logins exitosos
  message: {
    error: {
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de login fallidos. Intente de nuevo en 15 minutos.',
    },
  },
});

// Aplicar limiters
app.use('/api/', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// Resto de middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());
```

**Instalar dependencia**:

```bash
npm install express-rate-limit --workspace=@siba/api
```

### 🧪 Testing

```bash
# Test 1: Login - 6 intentos fallidos deben bloquear
for i in {1..6}; do
  echo "Intento $i:"
  curl -i -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong-password"}' \
    | grep -E "HTTP|error"
  sleep 0.5
done
# Esperado: Primeros 5 retornan 401, el 6to retorna 429 Too Many Requests

# Test 2: Headers de rate limit presentes
curl -I http://localhost:3003/api/tickets
# Esperado:
# RateLimit-Limit: 100
# RateLimit-Remaining: 99
# RateLimit-Reset: <timestamp>

# Test 3: Login exitoso no cuenta para el límite
curl -X POST http://localhost:3003/api/auth/login \
  -d '{"email":"valid@test.com","password":"correct-password"}'
# Luego intentar 5 más con contraseña incorrecta
# Esperado: Aún permite 5 intentos fallidos
```

### 📚 Referencias

- **Fuente**: [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md) líneas 111-135
- **Skill**: [siba-security](../../.agent/skills/siba-security/SKILL.md)
- **OWASP**: [A04:2021 - Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- **NPM**: [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)

### ✅ Checklist de Resolución

- [ ] Instalar express-rate-limit
- [ ] Configurar globalLimiter (100 req/15min)
- [ ] Configurar loginLimiter (5 req/15min)
- [ ] Aplicar limiters en index.ts
- [ ] Ejecutar tests de rate limiting
- [ ] Verificar headers RateLimit-\*
- [ ] Documentar límites en API docs
- [ ] Code review aprobado

---

## SEC-004: Bcrypt Rounds Insuficientes

### 📌 Descripción

El hashing de contraseñas usa 10 rounds de bcrypt cuando el estándar actual recomienda 12 rounds mínimo, haciendo que las contraseñas sean más vulnerables a ataques de fuerza bruta.

### 🎯 Ubicación

- [apps/api/src/services/auth.service.ts](../../apps/api/src/services/auth.service.ts) (función de registro/hash)

### ⚠️ Impacto

- **CVSS 3.1 Score**: 5.3 (Medio)
- **Velocidad de brute force**: 10 rounds = ~10ms/hash, 12 rounds = ~100ms/hash
- **Factor de protección**: 12 rounds es 4x más lento que 10 rounds
- **Recomendación OWASP 2026**: Mínimo 12 rounds

### 🐛 Código Vulnerable

```typescript
// ❌ INSUFICIENTE
const hashedPassword = await bcrypt.hash(password, 10);
```

### ✅ Solución

```typescript
// ✅ SEGURO
const BCRYPT_ROUNDS = 12; // OWASP 2026 recommendation

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Uso
const hashedPassword = await hashPassword(userPassword);
```

### 🧪 Testing

```bash
# Test: Medir tiempo de hash (debe ser ~100-200ms)
time node -e "
  const bcrypt = require('bcryptjs');
  (async () => {
    await bcrypt.hash('test123', 12);
  })();
"
# Esperado: real 0m0.150s (aproximadamente)

# Comparación con 10 rounds
time node -e "
  const bcrypt = require('bcryptjs');
  (async () => {
    await bcrypt.hash('test123', 10);
  })();
"
# Esperado: real 0m0.040s (aproximadamente)
```

### 📚 Referencias

- **Fuente**: [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md) líneas 136-145
- **OWASP**: [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- **Skill**: [siba-auth](../../.agent/skills/siba-auth/SKILL.md)

### ✅ Checklist de Resolución

- [ ] Actualizar BCRYPT_ROUNDS a 12
- [ ] Probar creación de usuario
- [ ] Verificar tiempo de respuesta aceptable (<300ms)
- [ ] Code review aprobado

---

## SEC-005: Upload sin Validación de Magic Bytes

### 📌 Descripción

La validación de archivos subidos solo verifica el MIME type (fácilmente falsificable), sin validar el contenido real del archivo (magic bytes), permitiendo subir archivos maliciosos disfrazados.

### 🎯 Ubicación

- [apps/api/src/controllers/upload.controller.ts](../../apps/api/src/controllers/upload.controller.ts)

### ⚠️ Impacto

- **CVSS 3.1 Score**: 6.1 (Medio)
- **Upload de malware** disfrazado como PDF/imagen
- **XSS** vía archivos HTML/SVG maliciosos
- **Path traversal** en nombres de archivo

**Escenario de ataque**:

```bash
# Subir ejecutable renombrado como imagen
cp malware.exe fake-image.jpg
# MIME type dice "image/jpeg" pero el contenido es un .exe
```

### 🐛 Código Vulnerable

```typescript
// ❌ VULNERABLE - Solo valida MIME type
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new Error('Tipo de archivo no permitido');
}
// ⚠️ Un atacante puede falsificar el MIME type
```

### ✅ Solución

```bash
# Instalar file-type
npm install file-type --workspace=@siba/api
```

```typescript
// ✅ SEGURO - Valida magic bytes (contenido real)
import { fileTypeFromBuffer } from 'file-type';

async function validateFileUpload(file: Express.Multer.File) {
  // 1. Validar MIME type declarado
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Tipo de archivo declarado no permitido');
  }

  // 2. Validar contenido real (magic bytes)
  const fileType = await fileTypeFromBuffer(file.buffer);

  if (!fileType) {
    throw new Error('No se pudo determinar el tipo de archivo');
  }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  if (!allowedExtensions.includes(fileType.ext)) {
    throw new Error(`Tipo de archivo real no permitido: ${fileType.ext}`);
  }

  // 3. Validar que el MIME declarado coincida con el real
  if (file.mimetype !== fileType.mime) {
    throw new Error(
      `MIME type declarado (${file.mimetype}) no coincide con el contenido real (${fileType.mime})`
    );
  }

  // 4. Sanitizar nombre de archivo
  const sanitizedFilename = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Solo alfanuméricos, puntos y guiones
    .replace(/\.{2,}/g, '.') // Prevenir ../ path traversal
    .substring(0, 255); // Limitar longitud

  return {
    isValid: true,
    mimeType: fileType.mime,
    extension: fileType.ext,
    sanitizedFilename,
  };
}
```

### 🧪 Testing

```bash
# Test 1: Subir archivo legítimo
curl -F "file=@real-image.jpg" http://localhost:3003/api/upload
# Esperado: 200 OK

# Test 2: Subir ejecutable renombrado como imagen
cp /bin/ls fake-image.jpg
curl -F "file=@fake-image.jpg" http://localhost:3003/api/upload
# Esperado: 400 Bad Request
# "Tipo de archivo real no permitido"

# Test 3: MIME type falsificado
curl -F "file=@malware.exe;type=image/jpeg" http://localhost:3003/api/upload
# Esperado: 400 Bad Request
# "MIME type declarado no coincide con el contenido real"
```

### 📚 Referencias

- **Fuente**: [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md) líneas 146-165
- **Skill**: [siba-file-upload](../../.agent/skills/siba-file-upload/SKILL.md)
- **OWASP**: [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- **NPM**: [file-type](https://www.npmjs.com/package/file-type)

### ✅ Checklist de Resolución

- [ ] Instalar file-type
- [ ] Implementar validateFileUpload()
- [ ] Aplicar validación en upload.controller.ts
- [ ] Ejecutar tests con archivos maliciosos
- [ ] Documentar tipos de archivo permitidos
- [ ] Code review aprobado

---

## 📊 Dashboard de Progreso

| ID      | Estado      | Responsable  | Fecha      |
| ------- | ----------- | ------------ | ---------- |
| SEC-001 | ✅ Resuelto | Backend Lead | 2026-02-04 |
| SEC-002 | ✅ Resuelto | Backend Lead | 2026-02-04 |
| SEC-003 | ✅ Resuelto | Backend Lead | 2026-02-04 |
| SEC-004 | ✅ Resuelto | Backend Lead | 2026-02-04 |
| SEC-005 | ✅ Resuelto | Backend Lead | 2026-02-04 |

**Progreso total**: 5/5 (100%)

---

## 🚨 Recomendación Final

✅ **TODAS LAS VULNERABILIDADES HAN SIDO RESUELTAS** (commit `fac1a9a`, 2026-02-04).

Implementaciones:

- **SEC-001**: JWT_SECRET validado al startup (min 32 chars, sin fallback)
- **SEC-002**: `authenticateToken` middleware en todas las rutas protegidas
- **SEC-003**: Rate limiting global (100 req/15min) + login estricto (5 req/15min)
- **SEC-004**: Bcrypt rounds aumentado a 12
- **SEC-005**: Validación de magic bytes en uploads (file-type)

---

**Última actualización**: 2026-02-06
**Responsable**: Tech Lead / Security Lead
