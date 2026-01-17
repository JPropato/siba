FROM node:22-alpine

# Instalar dependencias necesarias para Prisma y node-gyp
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Instalar dependencias del monorepo y del api
RUN npm install

# Exponer puertos (API y Prisma Studio)
EXPOSE 3001
EXPOSE 5555

# El comando se define en el docker-compose.yml
CMD ["npm", "run", "dev", "-w", "@siba/api"]
