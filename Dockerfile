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
RUN npm run build -w @siba/api

# Exponer puerto de la API
EXPOSE 3001

# Comando para producción
CMD ["node", "apps/api/dist/index.js"]
