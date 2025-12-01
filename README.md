# Plataforma de Retos Algorítmicos

Una plataforma completa para la gestión de retos de programación con Clean Architecture, procesamiento asíncrono y ejecución segura de código.

## 🚀 Características

- **Autenticación JWT** con roles (STUDENT, ADMIN, PROFESSOR)
- **Gestión de Retos** con casos de prueba y diferentes niveles de dificultad
- **Sistema de Submissions** con procesamiento asíncrono
- **Runners por Lenguaje** (Python, JavaScript, C++, Java) con contenedores aislados
- **Sistema de Cursos** y evaluaciones
- **Leaderboard** en tiempo real
- **Observabilidad** con logs estructurados y métricas
- **Asistente IA** para generar retos
- **Docker Compose** para despliegue fácil

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

```
src/
├── domain/           # Entidades y reglas de negocio
├── application/      # Casos de uso
├── infrastructure/   # Implementaciones concretas
└── presentation/     # Controladores y rutas
```

## 🛠️ Tecnologías

- **Backend**: Node.js + TypeScript + Express
- **Base de Datos**: MongoDB
- **Cola de Trabajos**: Redis + Bull
- **Contenedores**: Docker
- **Proxy**: Nginx
- **Logging**: Winston
- **Testing**: Jest

## 📋 Requisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- MongoDB 7.0+
- Redis 7.2+

## 🚀 Instalación y Uso

### Opción 1: Con Docker (Recomendado)

**Prerequisitos:**
- Docker Desktop instalado y ejecutándose
- Docker Compose v2.0+

```bash
# Verificar que Docker esté ejecutándose
docker --version
docker-compose --version

# Ejecutar el proyecto
docker-compose up --build -d

# Verificar que los servicios estén funcionando
docker-compose ps
curl http://localhost:3000/health

# Poblar la base de datos con datos iniciales (opcional)
docker-compose exec api npm run seed
```

**Si Docker Desktop no está ejecutándose:**
```bash
# En Windows PowerShell
.\scripts\start-docker.ps1

# En Linux/Mac
./scripts/start-docker.sh
```

### Opción 2: Sin Docker (Para desarrollo)

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar tests
npm test

# Ejecutar demo
node demo.js
```

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd algorithmic-challenges-platform
```

### 2. Configurar variables de entorno

```bash
cp env.example .env
# Editar .env con tus configuraciones
```

### 3. Ejecutar con Docker Compose

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Escalar workers
docker-compose up --scale worker-python=3 --scale worker-javascript=2
```

### 4. Poblar base de datos con datos iniciales (Opcional)

```bash
# Ejecutar seed dentro del contenedor
docker-compose exec api npm run seed

# O si estás ejecutando localmente
npm run seed

# Para resetear y volver a crear todo
npm run seed:reset
```

Esto creará:
- Usuarios de prueba (admin, professor, students)
- Un curso de ejemplo
- Challenges de ejemplo (Two Sum, Reverse String, Valid Parentheses)

**Credenciales de prueba:**
- Admin: `admin@example.com` / `123456`
- Professor: `professor@example.com` / `123456`
- Student: `student@example.com` / `123456`

### 5. Verificar la instalación

```bash
# Health check
curl http://localhost:3000/health

# Verificar métricas
curl http://localhost:3000/api/metrics
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `GET /api/auth/me` - Obtener perfil actual
- `POST /api/auth/refresh` - Renovar token

### Retos
- `GET /api/challenges` - Listar retos
- `POST /api/challenges` - Crear reto (ADMIN/PROFESSOR)
- `GET /api/challenges/:id` - Obtener reto por ID
- `PUT /api/challenges/:id` - Actualizar reto
- `DELETE /api/challenges/:id` - Eliminar reto
- `GET /api/challenges/search?q=query` - Buscar retos

### Submissions
- `POST /api/submissions` - Enviar solución
- `GET /api/submissions` - Listar submissions
- `GET /api/submissions/my` - Mis submissions
- `GET /api/submissions/:id` - Obtener submission por ID
- `GET /api/submissions/stats` - Estadísticas de submissions

### Métricas
- `GET /api/metrics` - Métricas del sistema

## 🔧 Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar servicios

```bash
# Iniciar MongoDB y Redis
docker-compose up mongodb redis -d

# O usar servicios locales
# MongoDB en puerto 27017
# Redis en puerto 6379
```

### 3. Ejecutar en modo desarrollo

```bash
# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm run test:coverage
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## 📊 Monitoreo y Observabilidad

### Logs Estructurados

Los logs se generan en formato JSON con información de contexto:

```json
{
  "level": "info",
  "msg": "Submission processed successfully",
  "submissionId": "subm-123",
  "status": "ACCEPTED",
  "score": 100,
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Métricas

El endpoint `/api/metrics` expone métricas del sistema:

- `submissions_total` - Total de submissions procesados
- `submissions_failed_total` - Total de fallos
- `average_execution_time_ms` - Tiempo promedio de ejecución
- `active_runners` - Runners activos

## 🔒 Seguridad

- **Autenticación JWT** con tokens seguros
- **Autorización por roles** (STUDENT, ADMIN, PROFESSOR)
- **Rate limiting** por IP y endpoint
- **Ejecución aislada** de código en contenedores
- **Headers de seguridad** con Helmet
- **Validación de entrada** con Joi

## 🐳 Docker

### Servicios incluidos

- **api**: API principal
- **mongodb**: Base de datos
- **redis**: Cola de trabajos
- **worker-***: Workers por lenguaje
- **nginx**: Proxy reverso

### Comandos útiles

```bash
# Ver logs de un servicio específico
docker-compose logs -f api

# Reiniciar un servicio
docker-compose restart api

# Ejecutar comando en un contenedor
docker-compose exec api npm run test

# Limpiar volúmenes
docker-compose down -v
```

## 📈 Escalabilidad

### Workers

Los workers se pueden escalar independientemente:

```bash
# Escalar workers de Python
docker-compose up --scale worker-python=5

# Escalar workers de JavaScript
docker-compose up --scale worker-javascript=3
```

### Base de Datos

- Índices optimizados para consultas frecuentes
- Sharding horizontal (configuración manual)
- Replicación (configuración manual)

## 🤖 Asistente IA

El asistente IA puede generar:

- Ideas de retos basadas en temas
- Casos de prueba automáticos
- Sugerencias de mejora para retos

```bash
# Configurar OpenAI API Key
export OPENAI_API_KEY=your-api-key
```

## 📝 Estructura de Datos

### Usuario
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "STUDENT",
  "isActive": true
}
```

### Reto
```json
{
  "id": "challenge-123",
  "title": "Two Sum",
  "description": "Dado un arreglo...",
  "difficulty": "Easy",
  "tags": ["arrays", "hashmap"],
  "timeLimit": 1500,
  "memoryLimit": 256,
  "status": "published",
  "testCases": [...]
}
```

### Submission
```json
{
  "id": "subm-123",
  "userId": "user-123",
  "challengeId": "challenge-123",
  "language": "python",
  "code": "def solution():...",
  "status": "ACCEPTED",
  "score": 100,
  "timeMsTotal": 720
}
```

## 🚨 Troubleshooting

### Problemas comunes

1. **Error de conexión a MongoDB**
   ```bash
   # Verificar que MongoDB esté ejecutándose
   docker-compose ps mongodb
   ```

2. **Workers no procesan jobs**
   ```bash
   # Verificar Redis
   docker-compose logs redis
   # Verificar workers
   docker-compose logs worker-python
   ```

3. **Error de permisos Docker**
   ```bash
   # Agregar usuario al grupo docker
   sudo usermod -aG docker $USER
   ```

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📞 Soporte

Para soporte, contacta a [tu-email@example.com] o crea un issue en el repositorio.

---

**Desarrollado con ❤️ usando Clean Architecture y las mejores prácticas de desarrollo.**