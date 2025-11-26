# Changelog

Todos los cambios notables a este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-27

### Added
- **Sistema de Autenticación JWT** con roles (STUDENT, ADMIN, PROFESSOR)
- **Gestión de Retos** con CRUD completo y casos de prueba
- **Sistema de Submissions** con procesamiento asíncrono
- **Runners por Lenguaje** (Python, JavaScript, C++, Java) con contenedores Docker aislados
- **Sistema de Cursos** y evaluaciones
- **Leaderboard** en tiempo real por reto, curso y evaluación
- **Observabilidad** con logs estructurados y métricas
- **Asistente IA** para generar retos y casos de prueba
- **Docker Compose** para despliegue fácil
- **Clean Architecture** con separación de capas
- **API REST** completa con validación y manejo de errores
- **Rate Limiting** y seguridad con Helmet
- **Tests automatizados** con Jest
- **Documentación completa** de API y arquitectura

### Technical Details
- Node.js + TypeScript + Express
- MongoDB con Mongoose
- Redis + Bull para cola de trabajos
- Docker para ejecución aislada de código
- Nginx como proxy reverso
- Winston para logging estructurado
- Joi para validación de datos
- bcryptjs para hash de contraseñas
- jsonwebtoken para autenticación

### Security Features
- Ejecución de código en contenedores aislados
- Sin acceso a red para runners
- Límites de CPU y memoria
- Sistema de archivos de solo lectura
- Autenticación JWT con roles
- Rate limiting por IP y endpoint
- Headers de seguridad

### Performance Features
- Procesamiento asíncrono con colas
- Workers escalables por lenguaje
- Índices optimizados en MongoDB
- Compresión HTTP
- Caching con Redis

## [Unreleased]

### Planned Features
- **Kubernetes** manifests para despliegue en K8s
- **WebSocket** para actualizaciones en tiempo real
- **File Upload** para casos de prueba
- **Advanced Analytics** y reportes
- **Multi-tenant** support
- **API Versioning**
- **GraphQL** endpoint
- **Mobile App** con React Native
