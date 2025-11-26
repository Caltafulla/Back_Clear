# Arquitectura del Sistema

## Clean Architecture

El proyecto sigue los principios de Clean Architecture con las siguientes capas:

### 1. Domain Layer (Dominio)
- **Entidades**: User, Challenge, Submission, Course, Evaluation, Leaderboard
- **Repositorios**: Interfaces para acceso a datos
- **Servicios**: Interfaces para lógica de negocio

### 2. Application Layer (Aplicación)
- **Casos de Uso**: LoginUseCase, CreateChallengeUseCase, SubmitSolutionUseCase, etc.
- **DTOs**: Objetos de transferencia de datos

### 3. Infrastructure Layer (Infraestructura)
- **Repositorios**: Implementaciones concretas (MongoDB)
- **Servicios**: Implementaciones concretas (AuthService, RunnerService, etc.)
- **Workers**: Procesadores de cola de trabajos

### 4. Presentation Layer (Presentación)
- **Controladores**: Manejo de requests HTTP
- **Rutas**: Definición de endpoints
- **Middlewares**: Autenticación, validación, manejo de errores

## Flujo de Datos

```
Request → Controller → UseCase → Repository → Database
                ↓
Response ← Controller ← UseCase ← Repository ← Database
```

## Procesamiento Asíncrono

### Cola de Trabajos (Redis + Bull)

1. **Submission Creation**: Se crea un registro en la base de datos
2. **Job Queuing**: Se encola el trabajo en Redis
3. **Worker Processing**: Los workers procesan los trabajos
4. **Code Execution**: Se ejecuta el código en contenedores aislados
5. **Result Update**: Se actualiza el resultado en la base de datos

### Workers por Lenguaje

- **Python Worker**: Procesa código Python
- **JavaScript Worker**: Procesa código JavaScript/Node.js
- **C++ Worker**: Procesa código C++
- **Java Worker**: Procesa código Java

## Seguridad

### Autenticación JWT
- Tokens con expiración configurable
- Roles: STUDENT, ADMIN, PROFESSOR
- Middleware de autenticación en todas las rutas protegidas

### Ejecución de Código
- Contenedores Docker aislados
- Sin acceso a red (`--network none`)
- Límites de CPU y memoria
- Sistema de archivos de solo lectura
- Destrucción automática de contenedores

### Rate Limiting
- Límites por IP y endpoint
- Configuración flexible por tipo de endpoint
- Headers de seguridad con Helmet

## Base de Datos

### MongoDB Collections
- **users**: Información de usuarios
- **challenges**: Retos y casos de prueba
- **submissions**: Envíos de código
- **courses**: Cursos y inscripciones
- **evaluations**: Evaluaciones y parciales

### Índices Optimizados
- Índices por campos de búsqueda frecuente
- Índices compuestos para consultas complejas
- Índices de texto para búsqueda full-text

## Observabilidad

### Logs Estructurados
- Formato JSON con Winston
- Contexto de request (ID, usuario, IP)
- Logs de submissions con trazabilidad completa
- Diferentes niveles de log por entorno

### Métricas
- Contadores de submissions procesados
- Tiempo promedio de ejecución
- Número de runners activos
- Tasa de errores

### Health Checks
- Endpoint `/health` para monitoreo
- Verificación de dependencias (MongoDB, Redis)
- Métricas de uptime y rendimiento

## Escalabilidad

### Horizontal Scaling
- Workers escalables independientemente
- Load balancing con Nginx
- Sharding de base de datos (configuración manual)

### Vertical Scaling
- Optimización de consultas de base de datos
- Caching con Redis
- Compresión de respuestas HTTP

## Despliegue

### Docker Compose
- Servicios orquestados
- Volúmenes persistentes
- Redes aisladas
- Variables de entorno configurables

### Kubernetes (Opcional)
- Manifiestos para despliegue en K8s
- Horizontal Pod Autoscaling
- Jobs para procesamiento de submissions
- ConfigMaps y Secrets

## Monitoreo y Alertas

### Métricas Clave
- Latencia de API
- Throughput de submissions
- Tasa de errores
- Uso de recursos

### Alertas Recomendadas
- Alta latencia de API (>2s)
- Tasa de errores alta (>5%)
- Workers inactivos
- Espacio en disco bajo
