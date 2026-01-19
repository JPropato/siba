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

# Build argument para la URL de la API (default para UAT)
ARG VITE_API_URL=http://siba-dev-esdwim-2588f1-148-230-79-241.traefik.me
ENV VITE_API_URL=$VITE_API_URL

# Compilar el frontend
RUN npm run build -w @siba/web

# Production stage - servir con nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
