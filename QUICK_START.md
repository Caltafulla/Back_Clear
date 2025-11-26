# Sistema de Ejecución de Código en Contenedores Docker - Guía Rápida

## ¿Qué es?

Un sistema completo y seguro para ejecutar código TypeScript/JavaScript de estudiantes en **contenedores Docker aislados** con restricciones exhaustivas de seguridad.

## 🚀 Características Principales

✅ **Ejecución en Docker**: Cada código se ejecuta en un contenedor completamente aislado  
✅ **Sin acceso a red**: `--network none`  
✅ **Límites de recursos**: CPU (0.5 cores), Memoria (512MB), Procesos (10)  
✅ **Sistema de archivos read-only**: Protección contra escrituras maliciosas  
✅ **Limpieza automática**: Los contenedores se eliminan al terminar  
✅ **Comparación automática**: Salida del estudiante vs salida esperada  
✅ **Métricas detalladas**: Tiempo, memoria, estado, errores por caso  
✅ **Soporte TypeScript**: Compila automáticamente TS a JS  

## 📦 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar TypeScript
npm run build

# 3. (Opcional) Construir imagen Docker personalizada
docker build -f Dockerfile.executor -t code-executor:latest .
```

## 🎯 Uso Rápido

```typescript
import { RunnerService } from './src/frameworks/RunnerService';
import { ProgrammingLanguage } from './src/domain/entities/Submission';

const runner = new RunnerService();

const result = await runner.executeCode({
  language: ProgrammingLanguage.JAVASCRIPT,
  code: `
    function main(getInput) {
      const n = parseInt(getInput());
      return n * 2;
    }
  `,
  timeLimit: 5000,      // 5 segundos
  memoryLimit: 512,     // 512 MB
  testCases: [
    {
      id: 'test-1',
      input: '5',
      expectedOutput: '10',
      isHidden: false
    }
  ]
});

console.log(`Score: ${result.score}%`);        // 100
console.log(`Status: ${result.status}`);      // ACCEPTED
```

## 📊 Salida del Sistema

```typescript
{
  status: "ACCEPTED",                          // Estado final
  score: 100,                                  // Porcentaje de tests pasados
  timeMsTotal: 523,                            // Tiempo total (ms)
  memoryKbTotal: 0,                            // Memoria total (KB)
  testCaseResults: [
    {
      caseId: "test-1",
      status: "ACCEPTED",
      timeMs: 523,
      memoryKb: 0,
      actualOutput: "10",
      expectedOutput: "10",
      errorMessage: undefined
    }
  ],
  errorMessage: undefined
}
```

## 🔒 Restricciones de Seguridad

| Característica | Valor | Propósito |
|---|---|---|
| Red | `--network none` | Sin acceso a internet |
| CPU | `--cpus 0.5` | Máximo 50% de un core |
| Memoria | `--memory 512m` | Máximo 512 MB |
| Procesos | `--pids-limit 10` | Máximo 10 procesos concurrentes |
| Filesystem | `--read-only` | Sistema de archivos de solo lectura |
| /tmp | tmpfs 100MB | Carpeta temporal limitada en RAM |
| Capacidades | `--cap-drop ALL` | Sin capacidades Linux |

## 📝 Ejemplos de Uso

Ver archivo: [`EXAMPLES_CONTAINER_EXECUTOR.ts`](./EXAMPLES_CONTAINER_EXECUTOR.ts)

### Ejemplo 1: Código Simple
```typescript
const code = `
  function main(getInput) {
    return parseInt(getInput()) * 2;
  }
`;
```

### Ejemplo 2: Múltiples Casos de Prueba
```typescript
testCases: [
  { id: '1', input: '5', expectedOutput: '10', isHidden: false },
  { id: '2', input: '3', expectedOutput: '6', isHidden: false },
  { id: '3', input: '0', expectedOutput: '0', isHidden: false }
]
```

### Ejemplo 3: TypeScript Automático
```typescript
const code = `
  interface Result {
    value: number;
  }
  
  function main(getInput: Function): number {
    const n = parseInt(getInput());
    const result: Result = { value: n * 2 };
    return result.value;
  }
`;
```

## 📁 Estructura de Archivos

```
src/
├── frameworks/
│   ├── ContainerCodeExecutor.ts    # Motor de ejecución en Docker
│   ├── RunnerService.ts             # Coordinador de lenguajes
│   └── DockerUtils.ts               # Utilidades Docker
├── domain/
│   ├── services/
│   │   └── IRunnerService.ts        # Interfaz del servicio
│   └── entities/
│       └── Submission.ts            # Tipos de datos
└── ...

CONTAINER_EXECUTOR.md                # Documentación completa
EXAMPLES_CONTAINER_EXECUTOR.ts       # Ejemplos de uso
```

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test -- ContainerCodeExecutor.test.ts

# Con cobertura
npm run test:coverage
```

## ⚙️ Configuración

### Cambiar Límites de Recursos

En `ContainerCodeExecutor.ts`, modifica los parámetros de Docker:

```typescript
// CPU: cambiar 0.5 a otro valor
'--cpus', '0.5',

// Memoria: cambiar 512 a otro valor
`--memory 512m`,

// Timeout: cambiar timeLimit
const timeLimit = 30000; // 30 segundos
```

## 🐛 Troubleshooting

### Error: "Cannot connect to Docker daemon"
```bash
# Verifica que Docker está corriendo
docker ps

# Si no funciona, inicia Docker Desktop
```

### Error: "TypeScript compilation error"
```typescript
// Asegúrate de que el código TypeScript es válido
// O escribe código JavaScript simple
```

### Timeout excedido
```typescript
// Aumenta el timeLimit
timeLimit: 10000  // 10 segundos en lugar de 5
```

### Memoria excedida
```typescript
// Aumenta el memoryLimit
memoryLimit: 1024  // 1GB en lugar de 512MB
```

## 📊 Casos de Uso

1. **Plataformas de Aprendizaje**: Ejecutar código de estudiantes de forma segura
2. **Jueces en Línea**: Evaluar soluciones de programación
3. **Entrevistas Técnicas**: Probar código en tiempo real
4. **Educación**: Sandbox para ejercicios de programación
5. **Evaluación Automática**: CI/CD para código de estudiantes

## 🚨 Importante

⚠️ **Requisitos**:
- Docker debe estar instalado y ejecutándose
- Node.js 18+ 
- En Windows/Mac, Docker Desktop debe estar corriendo

⚠️ **Limitaciones Conocidas**:
- Memoria actual se reporta como 0KB (Docker no expone fácilmente)
- Solo JavaScript/TypeScript completamente implementado
- Python, C++, Java son TODO

⚠️ **Seguridad**:
- Nunca ejecutes código de fuentes no confiables sin este sistema
- Los contenedores están aislados pero no son 100% seguros
- Mantén Docker actualizado

## 📚 Documentación Completa

Ver: [`CONTAINER_EXECUTOR.md`](./CONTAINER_EXECUTOR.md)

## 🤝 Contribuir

Para agregar soporte a nuevos lenguajes:

1. Crear `src/runners/{language}-executor.ts`
2. Implementar la lógica de ejecución en Docker
3. Agregar tests en `src/__tests__/{language}-executor.test.ts`
4. Actualizar `RunnerService.ts`

## 📝 Licencia

MIT

## 🔗 Referencias Útiles

- [Docker Security](https://docs.docker.com/engine/security/)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)
- [TypeScript Compiler](https://www.typescriptlang.org/tsconfig)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
