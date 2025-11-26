# Sistema de Ejecución de Código en Contenedores Docker

## Descripción General

Este sistema implementa un ejecutor de código TypeScript/JavaScript completamente seguro que ejecuta el código de estudiantes en contenedores Docker aislados con restricciones de seguridad exhaustivas.

## Características Principales

### 🔒 Seguridad

- **Sin acceso a red**: `--network none` - Los contenedores no pueden acceder a la red
- **Aislamiento de CPU**: `--cpus 0.5` - Máximo de 0.5 cores de CPU
- **Aislamiento de memoria**: `--memory 512m` - Máximo de 512MB de RAM
- **Swap deshabilitado**: Los contenedores no pueden usar swap
- **Sistema de archivos read-only**: El contenedor no puede escribir en el sistema de archivos
- **Límite de procesos**: `--pids-limit 10` - Máximo 10 procesos concurrentes
- **Sin privilegios**: Ejecuta con un usuario sin privilegios dentro del contenedor
- **Capacidades Linux limitadas**: `--cap-drop ALL` - Elimina todas las capacidades
- **Tmpfs temporal**: `/tmp` y `/run` en memoria con límites de tamaño
- **Timeout configurable**: Cada ejecución tiene un límite de tiempo máximo

### 📊 Métricas Capturadas

Cada ejecución proporciona:

1. **Estado**: ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, RUNTIME_ERROR, COMPILATION_ERROR
2. **Puntuación**: Porcentaje de casos de prueba que pasaron
3. **Tiempo total**: Tiempo combinado de ejecución de todos los casos de prueba (ms)
4. **Memoria total**: Memoria combinada de todos los casos de prueba (KB)
5. **Resultados por caso de prueba**:
   - ID del caso
   - Estado
   - Tiempo de ejecución
   - Memoria utilizada
   - Salida actual vs esperada
   - Mensaje de error (si aplica)

## Arquitectura

### Componentes Principales

#### 1. **ContainerCodeExecutor** (`src/frameworks/ContainerCodeExecutor.ts`)
- Ejecutor de bajo nivel que maneja la interacción con Docker
- Responsable de:
  - Compilar TypeScript a JavaScript
  - Crear contenedores Docker
  - Monitorear la ejecución
  - Limpiar recursos
  - Capturar salida y errores

#### 2. **RunnerService** (`src/frameworks/RunnerService.ts`)
- Servicio de coordinación de ejecución
- Implementa la interfaz `IRunnerService`
- Soporta múltiples lenguajes (JavaScript, Python, C++, Java)
- Actualmente implementa JavaScript completamente

#### 3. **DockerUtils** (`src/frameworks/DockerUtils.ts`)
- Utilidades auxiliares para Docker
- Builders para construir comandos Docker de forma segura
- Métodos para verificar disponibilidad de Docker
- Gestión de volúmenes temporales

## Flujo de Ejecución

```
Input: Código + Test Cases
    ↓
1. Preparación del código
   - Si es TypeScript: compilar a JavaScript
   - Envolver el código con entrada/salida
    ↓
2. Para cada test case:
   - Crear directorio temporal
   - Escribir código en archivo
   - Crear contenedor Docker con restricciones
   - Ejecutar código
   - Capturar salida/errores
   - Comparar con salida esperada
   - Limpiar contenedor
    ↓
3. Agregar resultados
   - Calcular puntuación
   - Determinar estado final
    ↓
Output: RunnerResult con todos los detalles
```

## Interfaz de Uso

### RunnerService

```typescript
interface RunnerConfig {
  language: ProgrammingLanguage;
  code: string;
  timeLimit: number; // en milliseconds
  memoryLimit: number; // en MB
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

interface RunnerResult {
  status: SubmissionStatus;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: Array<{
    caseId: string;
    status: SubmissionStatus;
    timeMs: number;
    memoryKb: number;
    actualOutput?: string;
    expectedOutput?: string;
    errorMessage?: string;
  }>;
  errorMessage?: string;
}
```

### Ejemplo de Uso

```typescript
import { RunnerService } from './frameworks/RunnerService';
import { ProgrammingLanguage } from './domain/entities/Submission';

const runner = new RunnerService();

const config = {
  language: ProgrammingLanguage.JAVASCRIPT,
  code: `
    function main(getInput) {
      const n = parseInt(getInput());
      return n * 2;
    }
  `,
  timeLimit: 5000, // 5 segundos
  memoryLimit: 512, // 512MB
  testCases: [
    {
      id: 'test-1',
      input: '5',
      expectedOutput: '10',
      isHidden: false
    },
    {
      id: 'test-2',
      input: '10',
      expectedOutput: '20',
      isHidden: false
    }
  ]
};

const result = await runner.executeCode(config);

console.log(`Score: ${result.score}%`);
console.log(`Status: ${result.status}`);
console.log(`Total Time: ${result.timeMsTotal}ms`);
console.log(`Total Memory: ${result.memoryKbTotal}KB`);

result.testCaseResults.forEach(tc => {
  console.log(`Test ${tc.caseId}: ${tc.status}`);
  if (tc.status !== 'ACCEPTED') {
    console.log(`  Expected: ${tc.expectedOutput}`);
    console.log(`  Got: ${tc.actualOutput}`);
  }
});
```

## Restricciones de Seguridad Detalladas

### Red
```bash
--network none
```
El contenedor no tiene acceso a ninguna interfaz de red.

### CPU
```bash
--cpus 0.5
```
Máximo de 50% de un core de CPU. Previene ataques de denegación de servicio.

### Memoria
```bash
--memory 512m
--memory-swap 512m
```
Máximo de 512MB con swap deshabilitado. Previene agotamiento de memoria.

### Procesos
```bash
--pids-limit 10
```
Máximo de 10 procesos. Previene fork bombs.

### Sistema de Archivos
```bash
--read-only
--tmpfs /tmp:rw,size=100m,noexec
--tmpfs /run:rw,size=50m,noexec
```
- Sistema de archivos principal read-only
- `/tmp` temporal en RAM con límite de 100MB (sin ejecución)
- `/run` temporal en RAM con límite de 50MB (sin ejecución)

### Capacidades Linux
```bash
--cap-drop ALL
--security-opt no-new-privileges
```
Elimina todas las capacidades Linux y previene escalación de privilegios.

## Estructura de Archivos

```
src/
├── frameworks/
│   ├── ContainerCodeExecutor.ts     # Ejecutor principal
│   ├── RunnerService.ts              # Servicio de coordinación
│   └── DockerUtils.ts                # Utilidades Docker
├── domain/
│   ├── entities/
│   │   └── Submission.ts             # Tipos de datos
│   └── services/
│       └── IRunnerService.ts          # Interfaz del servicio
└── ...

Dockerfile                            # Imagen principal del servidor
Dockerfile.executor                   # Imagen para ejecutar código (opcional)
scripts/
├── executor-entrypoint.sh           # Script de entrada para contenedor
└── ...
```

## Instalación y Configuración

### Requisitos Previos

1. **Docker**: Debe estar instalado y disponible
2. **Node.js**: v18 o superior
3. **npm**: Para instalar dependencias

### Instalación

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# (Opcional) Construir imagen Docker personalizada
docker build -f Dockerfile.executor -t code-executor:latest .
```

### Verificar Instalación

```typescript
import { RunnerService } from './frameworks/RunnerService';

const runner = new RunnerService();
console.log(runner.getSupportedLanguages());
```

## Limitaciones y Consideraciones

### Limitaciones Conocidas

1. **Memoria**: Se reporta como 0KB (Docker no expone fácilmente el uso real)
2. **Lenguajes**: Actualmente solo JavaScript/TypeScript está completamente implementado
3. **Entrada**: Actualmente solo soporta entrada como texto separado por líneas

### Futuras Mejoras

- [ ] Implementar Python, C++, Java en contenedores
- [ ] Capturar métricas de memoria en tiempo real
- [ ] Soporte para binarios compilados
- [ ] Caché de imágenes Docker optimizadas
- [ ] Pool de contenedores reutilizables
- [ ] Monitoreo de recursos en tiempo real
- [ ] Integración con sistemas de métricas (Prometheus)

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Docker execution error: Cannot connect to Docker daemon` | Docker no está corriendo | Iniciar Docker |
| `TypeScript compilation error` | Código TypeScript inválido | Validar sintaxis |
| `Time limit exceeded` | Código se ejecuta muy lentamente | Optimizar código o aumentar límite |
| `Process exited with code X` | Error en tiempo de ejecución | Revisar logs de error |

## Limpieza de Recursos

### Automática
- Los contenedores se limpian automáticamente (`--rm`)
- Los archivos temporales se eliminan después de cada ejecución

### Manual
```typescript
// Limpiar todos los contenedores activos
await runner.cleanup();

// Obtener estadísticas
const stats = await runner.getRunnerStats();
console.log(`Active containers: ${stats.activeRunners}`);
```

## Rendimiento

### Benchmarks Tipicos

- Ejecución simple: ~500-1000ms (incluyendo creación de contenedor)
- 10 test cases: ~5-10s
- Múltiples envíos paralelos: ~2-3 contenedores simultáneos recomendados

### Optimizaciones

1. Las imágenes Docker se cachean automáticamente
2. Los archivos temporales se usan en la memoria local
3. Los procesos se terminan exactamente al expirar el timeout

## Licencia

MIT

## Referencias

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
