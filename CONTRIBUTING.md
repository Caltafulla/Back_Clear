# Contributing to Algorithmic Challenges Platform

¡Gracias por tu interés en contribuir a este proyecto! Este documento proporciona guías para contribuir al desarrollo de la plataforma.

## 🚀 Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/tu-usuario/algorithmic-challenges-platform.git
cd algorithmic-challenges-platform

# Agregar el repositorio original como upstream
git remote add upstream https://github.com/original-repo/algorithmic-challenges-platform.git
```

### 2. Configurar el Entorno de Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env

# Iniciar servicios de desarrollo
docker-compose up mongodb redis -d

# Ejecutar tests
npm test
```

### 3. Crear una Rama

```bash
# Crear una nueva rama para tu feature
git checkout -b feature/nombre-de-tu-feature

# O para bugfixes
git checkout -b fix/descripcion-del-bug
```

### 4. Desarrollo

- Sigue las convenciones de código existentes
- Escribe tests para nuevas funcionalidades
- Actualiza la documentación cuando sea necesario
- Mantén commits pequeños y descriptivos

### 5. Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests de integración
npm run test:integration

# Linting
npm run lint
npm run lint:fix
```

### 6. Commit y Push

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: add new challenge difficulty level"

# Push a tu fork
git push origin feature/nombre-de-tu-feature
```

### 7. Pull Request

- Crear un Pull Request desde tu fork
- Describir claramente los cambios realizados
- Incluir screenshots si aplica
- Referenciar issues relacionados

## 📋 Convenciones

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Código

- **TypeScript**: Usar tipos estrictos
- **ESLint**: Seguir las reglas configuradas
- **Naming**: camelCase para variables, PascalCase para clases
- **Comments**: Documentar funciones complejas
- **Error Handling**: Usar try-catch apropiadamente

### Estructura de Archivos

```
src/
├── domain/           # Entidades y reglas de negocio
├── application/      # Casos de uso
├── infrastructure/   # Implementaciones concretas
└── presentation/    # Controladores y rutas
```

## 🧪 Testing

### Tests Unitarios

```typescript
// Ejemplo de test unitario
describe('AuthService', () => {
  it('should hash password correctly', async () => {
    const authService = new AuthService();
    const password = 'test123';
    const hashed = await authService.hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
  });
});
```

### Tests de Integración

```typescript
// Ejemplo de test de integración
describe('API Integration', () => {
  it('should create user and login', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    // Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body.data.token).toBeDefined();
  });
});
```

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verificar que el bug no haya sido reportado ya
2. Probar con la última versión
3. Verificar que sea realmente un bug

### Información Requerida

- **Descripción**: Descripción clara del problema
- **Pasos para Reproducir**: Pasos específicos
- **Comportamiento Esperado**: Qué debería pasar
- **Comportamiento Actual**: Qué está pasando
- **Screenshots**: Si aplica
- **Entorno**: OS, Node.js version, Docker version

### Template de Bug Report

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- Docker: [e.g. 24.0.0]

## Additional Context
Any other context about the problem
```

## ✨ Solicitar Features

### Antes de Solicitar

1. Verificar que la feature no exista ya
2. Considerar si es realmente necesaria
3. Pensar en la implementación

### Información Requerida

- **Descripción**: Qué feature quieres
- **Problema**: Qué problema resuelve
- **Solución Propuesta**: Cómo lo implementarías
- **Alternativas**: Otras soluciones consideradas

### Template de Feature Request

```markdown
## Feature Description
Brief description of the feature

## Problem
What problem does this feature solve?

## Proposed Solution
How would you implement this feature?

## Alternatives
What alternatives have you considered?

## Additional Context
Any other context or screenshots
```

## 📚 Documentación

### Actualizar Documentación

- **README.md**: Para cambios importantes
- **docs/API.md**: Para cambios en la API
- **docs/ARCHITECTURE.md**: Para cambios arquitectónicos
- **docs/DEPLOYMENT.md**: Para cambios de despliegue

### Estilo de Documentación

- Usar Markdown
- Incluir ejemplos de código
- Mantener actualizada
- Ser clara y concisa

## 🔍 Code Review

### Como Reviewer

- Revisar código, no personas
- Ser constructivo
- Sugerir mejoras
- Aprobar cuando esté listo

### Como Author

- Responder a comentarios
- Hacer cambios solicitados
- Explicar decisiones complejas
- Mantener PRs pequeños

## 🏷️ Release Process

### Versionado

Usamos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Bug fixes compatibles

### Release Notes

- Documentar cambios en CHANGELOG.md
- Incluir breaking changes
- Destacar nuevas features
- Listar bug fixes

## 🤝 Comunidad

### Código de Conducta

- Ser respetuoso
- Ser inclusivo
- Ser constructivo
- Ser profesional

### Canales de Comunicación

- **Issues**: Para bugs y features
- **Discussions**: Para preguntas generales
- **Pull Requests**: Para contribuciones

## 📞 Soporte

Si tienes preguntas sobre cómo contribuir:

- Abre un issue con la etiqueta `question`
- Únete a las discussions
- Revisa la documentación existente

---

¡Gracias por contribuir a hacer este proyecto mejor! 🎉
