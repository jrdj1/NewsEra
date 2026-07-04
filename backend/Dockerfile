FROM node:20-alpine
WORKDIR /app

# Contexto de build = raíz del repo (ver docker-compose.yml): el backend
# depende de docs/abis/, que vive fuera de backend/.
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/. .
COPY docs/abis /docs/abis

# El motor de Prisma generado en el host (Windows) no sirve dentro del
# contenedor (linux-musl/alpine); se regenera aquí con la plataforma correcta.
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
