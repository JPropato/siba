# Sistema Bauman - Documentación de API

> **Versión**: 1.0

---

## 🎯 Estrategia de Documentación

Usaremos **Swagger/OpenAPI** para documentar la API automáticamente.

---

## 📦 Herramientas

| Herramienta | Propósito |
|-------------|-----------|
| **swagger-jsdoc** | Generar spec desde comentarios JSDoc |
| **swagger-ui-express** | UI interactiva en `/api/docs` |
| **zod-to-openapi** | Convertir schemas Zod a OpenAPI |

### Instalación

```bash
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
npm install @asteasolutions/zod-to-openapi
```

---

## ⚙️ Configuración

### swagger.ts

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Bauman API',
      version: '1.0.0',
      description: 'API del ERP Sistema Bauman',
    },
    servers: [
      { url: '/api', description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
}
```

### En app.ts

```typescript
import { setupSwagger } from './swagger';

// ... otras configs
setupSwagger(app);
```

---

## 📝 Documentar Endpoints

### Ejemplo con JSDoc

```typescript
/**
 * @openapi
 * /clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Listar clientes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items por página
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 */
router.get('/', controller.list);
```

---

## 🔷 Schemas con Zod + OpenAPI

```typescript
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ClienteSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'YPF SA' }),
  cuit: z.string().openapi({ example: '30-12345678-9' }),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  createdAt: z.date(),
}).openapi('Cliente');

export const CreateClienteSchema = ClienteSchema.omit({
  id: true,
  createdAt: true,
}).openapi('CreateCliente');
```

---

## 🌐 Acceso a la Documentación

Una vez configurado, la documentación estará disponible en:

```
http://localhost:3001/api/docs
```

### Features de Swagger UI

- ✅ Explorar endpoints
- ✅ Ver schemas de request/response
- ✅ Probar endpoints (Try it out)
- ✅ Autenticarse con JWT
- ✅ Exportar OpenAPI spec

---

## 📋 Estructura de Endpoints

### Por Módulo

| Módulo | Base Path | Ejemplo |
|--------|-----------|---------|
| Auth | `/api/auth` | `POST /api/auth/login` |
| Usuarios | `/api/users` | `GET /api/users` |
| Clientes | `/api/clientes` | `GET /api/clientes/:id` |
| Sucursales | `/api/sucursales` | `POST /api/sucursales` |
| Tickets | `/api/tickets` | `PATCH /api/tickets/:id/estado` |
| Obras | `/api/obras` | `GET /api/obras/:id/presupuesto` |
| Finanzas | `/api/finanzas` | `GET /api/finanzas/gastos` |

### Verbos HTTP

| Verbo | Uso |
|-------|-----|
| `GET` | Obtener recursos |
| `POST` | Crear recurso |
| `PUT` | Reemplazar recurso completo |
| `PATCH` | Actualizar parcialmente |
| `DELETE` | Eliminar recurso |

---

## ✅ Checklist

- [ ] swagger-jsdoc instalado
- [ ] swagger-ui-express configurado
- [ ] Schemas Zod con OpenAPI
- [ ] Endpoints documentados con JSDoc
- [ ] `/api/docs` accesible
