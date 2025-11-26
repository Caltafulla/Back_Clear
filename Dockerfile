# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    gcc \
    g++ \
    make \
    openjdk11-jre \
    openjdk11-jdk \
    curl

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar TODAS las dependencias (incluidas devDependencies)
RUN npm install

# Copiar el código fuente y compilar
COPY src/ ./src/
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine
WORKDIR /app

# Instalar dependencias del sistema mínimas
RUN apk add --no-cache \
    python3 \
    py3-pip \
    openjdk11-jre \
    curl

# Copiar archivos necesarios
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar los archivos compilados desde la etapa de build
COPY --from=build /app/dist ./dist

# Crear usuario sin privilegios
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /app/uploads /app/logs && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
