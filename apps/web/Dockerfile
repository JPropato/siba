# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Instalar dependencias
RUN npm ci

# Copiar código fuente del frontend
COPY apps/web/ ./apps/web/

# Compilar el frontend (sin necesidad de VITE_API_URL en build time)
RUN npm run build -w @siba/web

# Production stage - servir con nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar script de entrada que genera config en runtime
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto 80
EXPOSE 80

# Usar entrypoint que genera config.js con variables de entorno
ENTRYPOINT ["/docker-entrypoint.sh"]
