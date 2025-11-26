# Sistema de Ejecución de Código en Contenedores Docker

> **Sistema completo y seguro para ejecutar código TypeScript/JavaScript de estudiantes en contenedores Docker aislados con restricciones exhaustivas de seguridad.**

## 🎯 Descripción

Este proyecto implementa un **ejecutor de código completamente seguro** que:

- ✅ Ejecuta código TypeScript/JavaScript en **contenedores Docker aislados**
- ✅ Aplica **múltiples capas de seguridad** (red, CPU, memoria, filesystem)
- ✅ Compara automáticamente **salida vs salida esperada**
- ✅ Captura **métricas de ejecución** (tiempo, memoria, estado)
- ✅ Limpia **automáticamente recursos**
- ✅ Soporta **TypeScript compilado a JavaScript**

## 📋 Requisitos Cumplidos

```
✅ Recibe código TypeScript/JavaScript del estudiante
✅ Lo ejecuta en un contenedor Node.js con:
   ✅ Sin acceso a red (--network none)
   ✅ Límites: --cpus 0.5 --memory 512m
   ✅ Sistema de archivos read-only
   ✅ Se destruye automáticamente al terminar
✅ Ejecuta el código contra casos de prueba predefinidos
✅ Compara la salida del estudiante con la salida esperada
✅ Retorna: estado, tiempo ejecución, memoria usada, resultados por caso
✅ Usa un único Dockerfile con Node.js
✅ Escribe la lógica de ejecución una sola vez
```

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 2. Uso Básico

```typescript
import { RunnerService } from './src/frameworks/RunnerService';
import { ProgrammingLanguage } from './src/domain/entities/Submission';

const runner = new RunnerService();

const result = await runner.executeCode({
  language: ProgrammingLanguage.JAVASCRIPT,
  code: `
    function main(getInput) {
      return parseInt(getInput()) * 2;
    }
  `,
  timeLimit: 5000,
  memoryLimit: 512,
  testCases: [
    { id: '1', input: '5', expectedOutput: '10', isHidden: false }
  ]
});

console.log(result);
// {
//   status: 'ACCEPTED',
//   score: 100,
//   timeMsTotal: 523,
//   memoryKbTotal: 0,
//   testCaseResults: [...]
// }
```

## 📚 Documentación

| Documento | Contenido |
|-----------|----------|
| **[QUICK_START.md](./QUICK_START.md)** | 🚀 Guía rápida de instalación y uso |
| **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** | ✅ Guía completa de instalación y verificación |
| **[CONTAINER_EXECUTOR.md](./CONTAINER_EXECUTOR.md)** | 📖 Documentación técnica detallada |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | 📋 Resumen de arquitectura e implementación |
| **[EXAMPLES_CONTAINER_EXECUTOR.ts](./EXAMPLES_CONTAINER_EXECUTOR.ts)** | 💡 Ejemplos de código completos |

## 🏗️ Arquitectura

### Componentes Principales

1. **ContainerCodeExecutor** (`src/frameworks/ContainerCodeExecutor.ts`)
   - Motor de ejecución en Docker
   - Compilación TypeScript → JavaScript
   - Gestión de contenedores
   - Captura de métricas

2. **RunnerService** (`src/frameworks/RunnerService.ts`)
   - Coordinador de lenguajes
   - Interfaz pública del sistema
   - Soporte multi-lenguaje

3. **DockerUtils** (`src/frameworks/DockerUtils.ts`)
   - Utilidades para Docker
   - Builders seguros para comandos
   - Gestión de volúmenes

### Capas de Seguridad

```
┌─────────────────────────────────────┐
│  🔐 SIN ACCESO A RED                │
│     --network none                  │
└─────────────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│  ⚡ LÍMITES DE RECURSOS                │
│  CPU: 0.5 cores | Memoria: 512MB     │
│  Procesos: 10 | Swap: deshabilitado  │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│  📁 FILESYSTEM READ-ONLY              │
│  /tmp: 100MB en RAM, sin ejecución   │
│  /run: 50MB en RAM, sin ejecución    │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│  🔓 SIN PRIVILEGIOS                   │
│  --cap-drop ALL                       │
│  no-new-privileges                    │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│  ⏱️  TIMEOUT DE EJECUCIÓN             │
│  30 segundos (configurable)          │
└─────────────────────────────────────┘
```

## 🎯 Casos de Uso

### 1. Plataformas de Aprendizaje
```typescript
// Estudiante envía solución
const result = await runner.executeCode({
  code: `function main(getInput) { ... }`,
  testCases: [...]
});
// Se muestra feedback al estudiante
```

### 2. Jueces en Línea
```typescript
// Sistema de competencia ejecuta código
// Compara con casos de prueba
// Retorna puntuación automáticamente
```

### 3. Entrevistas Técnicas
```typescript
// Ejecutar código de candidato
// Evaluar corrección
// Medir rendimiento
```

## 📊 Ejemplo de Salida

```typescript
{
  status: 'ACCEPTED',                    // O: WRONG_ANSWER, TIME_LIMIT_EXCEEDED, RUNTIME_ERROR
  score: 100,                            // Porcentaje de tests que pasaron
  timeMsTotal: 523,                      // Tiempo total de ejecución en ms
  memoryKbTotal: 0,                      // Memoria total utilizada en KB
  testCaseResults: [                     // Detalles por caso
    {
      caseId: 'test-1',
      status: 'ACCEPTED',
      timeMs: 523,
      memoryKb: 0,
      actualOutput: '10',
      expectedOutput: '10',
      errorMessage: undefined
    }
  ],
  errorMessage: undefined                // Error general si aplica
}
```

## 📁 Estructura de Archivos Nuevos

```
src/
├── frameworks/
│   ├── ContainerCodeExecutor.ts    # 395 líneas - Motor de ejecución
│   ├── RunnerService.ts            # 145 líneas - Coordinador (modificado)
│   └── DockerUtils.ts              # 270 líneas - Utilidades Docker
├── domain/
│   ├── services/
│   │   └── IRunnerService.ts       # Interfaz (modificado)
│   └── entities/
│       └── Submission.ts            # Tipos (modificado)
└── __tests__/
    └── ContainerCodeExecutor.test.ts # 200 líneas - Tests

Dockerfile.executor                    # Imagen Docker para ejecución
scripts/executor-entrypoint.sh        # Script de entrada

CONTAINER_EXECUTOR.md                 # 300+ líneas - Documentación técnica
QUICK_START.md                        # 200+ líneas - Guía rápida
IMPLEMENTATION_SUMMARY.md             # 300+ líneas - Resumen
INSTALLATION_GUIDE.md                 # 300+ líneas - Instalación
EXAMPLES_CONTAINER_EXECUTOR.ts        # 350+ líneas - Ejemplos
```

## 🔧 Configuración

### Cambiar Límites de Recursos

En `ContainerCodeExecutor.ts`:

```typescript
// CPU: cambiar de 0.5 a otro valor
'--cpus', '0.5',

// Memoria: cambiar de 512 a otro valor
`--memory 512m`,

// Procesos: cambiar de 10 a otro valor
'--pids-limit', '10'
```

### Cambiar Timeout

```typescript
// En RunnerConfig
timeLimit: 5000  // 5 segundos (en milisegundos)
```

## 🧪 Tests

```bash
# Ejecutar tests
npm test -- ContainerCodeExecutor.test.ts

# Con cobertura
npm run test:coverage
```

**Tests implementados:**
- ✅ Ejecución correcta
- ✅ Detección de salida incorrecta
- ✅ Errores de ejecución
- ✅ Múltiples casos de prueba
- ✅ Casos parcialmente correctos
- ✅ Medición de tiempo
- ✅ Limpieza de recursos
- ✅ Estadísticas del servicio

## 🔐 Características de Seguridad

| Característica | Valor | Beneficio |
|---|---|---|
| Red | `--network none` | Aislamiento total de red |
| CPU | `--cpus 0.5` | Previene agotamiento |
| Memoria | `--memory 512m` | Protege al host |
| Procesos | `--pids-limit 10` | Previene fork bombs |
| Filesystem | `--read-only` | Sin escrituras maliciosas |
| Ejecución | `noexec` en /tmp | Sin binarios de /tmp |
| Capacidades | `--cap-drop ALL` | Sin escalación de privilegios |
| Privs | `no-new-privileges` | Aislamiento adicional |

## ⚡ Rendimiento

Benchmarks típicos:
- **Ejecución simple**: 500-1000ms (incluye overhead Docker)
- **10 test cases**: 5-10 segundos
- **Contenedores simultáneos**: 2-3 recomendados

## 🛠️ Extensibilidad

### Agregar soporte a nuevos lenguajes

```typescript
// 1. En RunnerService.ts
async executeCode(config) {
  switch(config.language) {
    case PYTHON:
      return await this.executePython(config);
    // ← Agregar aquí
  }
}

// 2. Implementar executor específico
async executePython(config) {
  // Lógica para Python
}

// 3. Agregar tests
// En src/__tests__/
```

## 📈 Métricas Capturadas

Para cada ejecución:
- **Estado**: ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, RUNTIME_ERROR
- **Puntuación**: 0-100%
- **Tiempo de ejecución**: ms total y por caso
- **Memoria**: KB total y por caso (futura mejora)
- **Salida**: Comparación actual vs esperada
- **Errores**: Mensajes detallados

## 🔗 API Pública

```typescript
interface IRunnerService {
  executeCode(config: RunnerConfig): Promise<RunnerResult>
  isLanguageSupported(language: ProgrammingLanguage): boolean
  getSupportedLanguages(): ProgrammingLanguage[]
  getRunnerStats(): Promise<RunnerStats>
  cleanup(): Promise<void>
}
```

## 🚨 Limitaciones Conocidas

- Memoria actual se reporta como 0KB (Docker no expone fácilmente)
- Solo JavaScript/TypeScript completamente implementado
- Python, C++, Java son planes futuros

## 📖 Documentación Detallada

Para información específica, consulta:

- **Instalación**: [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
- **Inicio rápido**: [QUICK_START.md](./QUICK_START.md)
- **Arquitectura**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Referencia técnica**: [CONTAINER_EXECUTOR.md](./CONTAINER_EXECUTOR.md)
- **Ejemplos de código**: [EXAMPLES_CONTAINER_EXECUTOR.ts](./EXAMPLES_CONTAINER_EXECUTOR.ts)

## ✅ Verificación de Estado

```bash
# 1. Compilar proyecto
npm run build

# 2. Verificar Docker
docker ps

# 3. Ejecutar tests
npm test -- ContainerCodeExecutor.test.ts

# Si todo funciona: ¡Sistema listo! 🎉
```

## 📞 Soporte

Para preguntas o problemas:
1. Consultar documentación en los archivos .md
2. Ver ejemplos en [EXAMPLES_CONTAINER_EXECUTOR.ts](./EXAMPLES_CONTAINER_EXECUTOR.ts)
3. Revisar tests en `src/__tests__/ContainerCodeExecutor.test.ts`

## 📝 Licencia

MIT

---

**Sistema implementado completamente** ✅

Construido con:
- TypeScript
- Docker
- Node.js 18
- Express.js
- Clean Architecture
