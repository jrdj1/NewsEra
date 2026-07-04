FROM node:20-alpine
WORKDIR /app

# Contexto de build = raíz del repo (ver docker-compose.yml): el frontend
# importa los ABIs de docs/abis/, que vive fuera de frontend/.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/. .
COPY docs/abis /docs/abis

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
