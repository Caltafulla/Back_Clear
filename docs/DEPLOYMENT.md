# Guía de Despliegue

## Requisitos del Sistema

### Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB SSD
- **Red**: Conexión estable a internet

### Recomendados
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disco**: 50GB+ SSD
- **Red**: Conexión de alta velocidad

## Instalación

### 1. Instalar Docker y Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar el Repositorio

```bash
git clone <repository-url>
cd algorithmic-challenges-platform
```

### 3. Configurar Variables de Entorno

```bash
cp env.example .env
# Editar .env con tus configuraciones
```

### 4. Ejecutar el Sistema

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build -d

# Verificar que todos los servicios estén ejecutándose
docker-compose ps
```

## Configuración de Producción

### Variables de Entorno Críticas

```bash
# Base de datos
DATABASE_URL=mongodb://username:password@mongodb:27017/algorithmic-challenges?authSource=admin
REDIS_URL=redis://redis:6379

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Servidor
NODE_ENV=production
PORT=3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
```

### Configuración de MongoDB

```bash
# Crear usuario administrador
mongosh --eval "
db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'secure-password',
  roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
});
"
```

### Configuración de SSL/TLS

1. **Generar certificados SSL**:
```bash
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx-selfsigned.key \
  -out ssl/nginx-selfsigned.crt
```

2. **Actualizar nginx.conf** para HTTPS:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;
    # ... resto de configuración
}
```

## Monitoreo

### Health Checks

```bash
# Verificar estado del sistema
curl http://localhost/health

# Verificar métricas
curl http://localhost/api/metrics
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### Métricas de Sistema

```bash
# Uso de recursos
docker stats

# Espacio en disco
df -h

# Memoria disponible
free -h
```

## Escalabilidad

### Escalar Workers

```bash
# Escalar workers de Python
docker-compose up --scale worker-python=5 -d

# Escalar workers de JavaScript
docker-compose up --scale worker-javascript=3 -d

# Escalar workers de C++
docker-compose up --scale worker-cpp=3 -d

# Escalar workers de Java
docker-compose up --scale worker-java=3 -d
```

### Load Balancing

Para múltiples instancias de la API:

```yaml
# docker-compose.yml
services:
  api-1:
    build: .
    environment:
      - INSTANCE_ID=1
  api-2:
    build: .
    environment:
      - INSTANCE_ID=2
  api-3:
    build: .
    environment:
      - INSTANCE_ID=3

  nginx:
    # Configuración de load balancing
    # ...
```

## Backup y Recuperación

### Backup de Base de Datos

```bash
# Backup completo
docker-compose exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# Backup específico de colección
docker-compose exec mongodb mongodump --db algorithmic-challenges --collection users --out /backup/users
```

### Restauración

```bash
# Restaurar desde backup
docker-compose exec mongodb mongorestore /backup/20250127
```

### Backup de Configuración

```bash
# Backup de archivos de configuración
tar -czf config-backup-$(date +%Y%m%d).tar.gz docker-compose.yml nginx.conf .env
```

## Mantenimiento

### Actualización del Sistema

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir imágenes
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d
```

### Limpieza de Recursos

```bash
# Limpiar contenedores no utilizados
docker system prune -f

# Limpiar volúmenes no utilizados
docker volume prune -f

# Limpiar imágenes no utilizadas
docker image prune -f
```

### Rotación de Logs

```bash
# Configurar logrotate
sudo nano /etc/logrotate.d/algorithmic-challenges

# Contenido del archivo:
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart api
    endscript
}
```

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a MongoDB**:
```bash
# Verificar estado del contenedor
docker-compose ps mongodb

# Ver logs
docker-compose logs mongodb

# Reiniciar servicio
docker-compose restart mongodb
```

2. **Workers no procesan jobs**:
```bash
# Verificar Redis
docker-compose logs redis

# Verificar workers
docker-compose logs worker-python

# Reiniciar workers
docker-compose restart worker-python
```

3. **Alto uso de memoria**:
```bash
# Verificar uso de memoria
docker stats

# Limpiar contenedores detenidos
docker system prune -f
```

### Logs de Debug

```bash
# Habilitar logs de debug
export LOG_LEVEL=debug
docker-compose restart api
```

## Seguridad

### Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3000   # Bloquear acceso directo a API
```

### Actualizaciones de Seguridad

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Actualizar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io
```

### Auditoría

```bash
# Verificar logs de acceso
docker-compose logs nginx | grep -E "(GET|POST|PUT|DELETE)"

# Verificar intentos de acceso no autorizados
docker-compose logs api | grep -i "unauthorized\|forbidden"
```
