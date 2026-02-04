---
name: siba-deployment
description: Guía de despliegue y ambientes para el proyecto SIBA
---

# SIBA Deployment

Lineamientos para desplegar y configurar ambientes del proyecto.

## Cuándo Usar

- Configures un **nuevo ambiente** (dev, staging, prod)
- Necesites **Docker** para desarrollo local
- Hagas **deploy** a producción
- Gestiones **variables de entorno**

---

## Ambientes

| Ambiente      | URL                 | Base de Datos    | Propósito  |
| ------------- | ------------------- | ---------------- | ---------- |
| `development` | localhost:5173/3001 | PostgreSQL local | Desarrollo |
| `staging/uat` | uat.siba.com        | PostgreSQL UAT   | Testing/QA |
| `production`  | app.siba.com        | PostgreSQL Prod  | Producción |

---

## Variables de Entorno

### Backend (.env)

```bash
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/siba_dev"

# JWT
JWT_SECRET="min-32-caracteres-secreto-seguro"
JWT_EXPIRES_IN="8h"

# Storage (MinIO/S3)
STORAGE_ENDPOINT="localhost"
STORAGE_PORT=9000
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
STORAGE_BUCKET="siba-files"

# Server
PORT=3001
NODE_ENV="development"
```

### Frontend (.env)

```bash
VITE_API_URL="http://localhost:3001/api"
VITE_STORAGE_URL="http://localhost:9000"
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: siba
      POSTGRES_PASSWORD: siba123
      POSTGRES_DB: siba_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://siba:siba123@postgres:5432/siba_dev
    depends_on:
      - postgres
      - minio

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '5173:80'
    depends_on:
      - api

volumes:
  postgres_data:
  minio_data:
```

---

## Dockerfile API

```dockerfile
# apps/api/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/

RUN npm ci

COPY apps/api/ ./apps/api/
RUN npm run build -w @siba/api

FROM node:22-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
```

---

## Dockerfile Web

```dockerfile
# apps/web/Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/

RUN npm ci

COPY apps/web/ ./apps/web/
RUN npm run build -w @siba/web

FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Nginx Config

```nginx
# apps/web/nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Comandos de Deploy

```bash
# Desarrollo local
docker-compose up -d postgres minio
npm run dev

# Build para producción
npm run build

# Deploy con Docker
docker-compose build
docker-compose up -d

# Solo rebuild API
docker-compose build api
docker-compose up -d api

# Ver logs
docker-compose logs -f api

# Ejecutar migraciones
docker-compose exec api npx prisma migrate deploy
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} \
            "cd /app && git pull && docker-compose build && docker-compose up -d"
```

---

## Checklist de Deploy

- [ ] Variables de entorno configuradas
- [ ] JWT_SECRET diferente por ambiente
- [ ] DATABASE_URL apunta al server correcto
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed de datos esenciales ejecutado
- [ ] CORS configurado correctamente
- [ ] SSL/HTTPS habilitado en producción
- [ ] Logs configurados
- [ ] Backups de BD automatizados
