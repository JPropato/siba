FROM node:22-alpine

# Instalar dependencias necesarias para Prisma y node-gyp
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package.json package-lock.json ./

# Copiar package.json de los workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Instalar TODAS las dependencias (incluyendo workspaces)
RUN npm ci

# Copiar el código fuente de la API
COPY apps/api/ ./apps/api/

# Generar Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Volver al directorio raíz y compilar TypeScript
WORKDIR /app
RUN npm run build -w @siba/shared
RUN npm run build -w @siba/api

# Copiar script de inicio
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto de la API
EXPOSE 3001

# Usar el script de inicio que ejecuta migraciones y luego inicia la app
ENTRYPOINT ["/docker-entrypoint.sh"]
