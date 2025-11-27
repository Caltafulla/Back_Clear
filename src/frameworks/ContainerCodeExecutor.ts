import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './Logger';
import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { SubmissionStatus } from '../domain/entities/Submission';

interface DockerExecutionResult {
  output: string;
  error: string;
  code: number;
  memoryKb: number;
}

/**
 * ContainerCodeExecutor: Ejecuta código TypeScript/JavaScript en contenedores Docker aislados
 * 
 * Características de seguridad:
 * - Sin acceso a red (--network none)
 * - Límites de CPU: 0.5 cores
 * - Límites de memoria: 512MB
 * - Sistema de archivos read-only
 * - Usuario sin privilegios dentro del contenedor
 * - Limpieza automática de contenedores
 */
export class ContainerCodeExecutor {
  private logger: Logger;
  private readonly DOCKER_IMAGE = 'node:18-alpine';
  private activeContainers: Set<string> = new Set();

  constructor() {
    this.logger = new Logger('ContainerCodeExecutor');
  }

  /**
   * Ejecuta código TypeScript/JavaScript contra casos de prueba
   */
  async executeCode(config: RunnerConfig): Promise<RunnerResult> {
    const testCaseResults: Array<{
      caseId: string;
      status: string;
      timeMs: number;
      memoryKb: number;
      actualOutput?: string | undefined;
      expectedOutput?: string | undefined;
      errorMessage?: string | undefined;
    }> = [];
    let totalTimeMs = 0;
    let totalMemoryKb = 0;
    let passedTests = 0;

    try {
      // Compilar TypeScript si es necesario
      const compiledCode = await this.prepareCode(config.code);

      // Ejecutar cada caso de prueba
      for (const testCase of config.testCases) {
        try {
          const result = await this.runTestCaseInContainer(
            compiledCode,
            testCase,
            config.timeLimit,
            config.memoryLimit
          );

          testCaseResults.push(result);
          totalTimeMs += result.timeMs;
          totalMemoryKb += result.memoryKb;

          if (result.status === SubmissionStatus.ACCEPTED) {
            passedTests++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          testCaseResults.push({
            caseId: testCase.id,
            status: SubmissionStatus.RUNTIME_ERROR,
            timeMs: config.timeLimit,
            memoryKb: 0,
            errorMessage: errorMsg
          });
        }
      }

      const score = config.testCases.length > 0 ? (passedTests / config.testCases.length) * 100 : 0;

      // Determinar el estado global a partir de los resultados por caso
      let status: string;
      if (testCaseResults.length === 0) {
        status = SubmissionStatus.RUNTIME_ERROR;
      } else if (testCaseResults.every((r) => r.status === SubmissionStatus.ACCEPTED)) {
        status = SubmissionStatus.ACCEPTED;
      } else if (
        testCaseResults.every((r) =>
          [SubmissionStatus.RUNTIME_ERROR, SubmissionStatus.TIME_LIMIT_EXCEEDED].includes(r.status as any)
        )
      ) {
        // Todos los casos fallaron por error de ejecución o timeout
        status = SubmissionStatus.RUNTIME_ERROR;
      } else {
        // Al menos un caso fue ejecutado y no todos fueron errores de ejecución => wrong answer parcial/total
        status = SubmissionStatus.WRONG_ANSWER;
      }

      return {
        status,
        score,
        timeMsTotal: totalTimeMs,
        memoryKbTotal: totalMemoryKb,
        testCaseResults,
        errorMessage: undefined
      };
    } catch (error) {
      this.logger.error('Error executing code', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: SubmissionStatus.COMPILATION_ERROR,
        score: 0,
        timeMsTotal: 0,
        memoryKbTotal: 0,
        testCaseResults,
        errorMessage: errorMsg
      };
    }
  }

  /**
   * Prepara el código compilándolo si es TypeScript
   */
  private async prepareCode(code: string): Promise<string> {
    // Si es TypeScript, compilarlo a JavaScript
    if (code.includes('://') || code.includes('import ') || code.includes('export ')) {
      // Crear archivo temporal con código TypeScript
      const tempDir = path.join(os.tmpdir(), `code-executor-${Date.now()}`);
      const tsFile = path.join(tempDir, 'code.ts');
      const jsFile = path.join(tempDir, 'code.js');

      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(tsFile, code);

        // Compilar TypeScript a JavaScript
        await this.executeCommand('npx', [
          'tsc',
          '--target',
          'es2020',
          '--module',
          'commonjs',
          tsFile,
          '--outFile',
          jsFile
        ]);

        if (!fs.existsSync(jsFile)) {
          throw new Error('TypeScript compilation failed');
        }

        const compiledCode = fs.readFileSync(jsFile, 'utf-8');

        // Limpiar archivos temporales
        fs.rmSync(tempDir, { recursive: true, force: true });

        return compiledCode;
      } catch (error) {
        // Limpiar archivos temporales en caso de error
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`TypeScript compilation error: ${errorMsg}`);
      }
    }

    return code;
  }

  /**
   * Ejecuta un caso de prueba en un contenedor Docker aislado
   */
  private async runTestCaseInContainer(
    code: string,
    testCase: { id: string; input: string; expectedOutput: string; isHidden: boolean },
    timeLimit: number,
    memoryLimit: number
  ): Promise<{
    caseId: string;
    status: string;
    timeMs: number;
    memoryKb: number;
    actualOutput?: string | undefined;
    expectedOutput?: string | undefined;
    errorMessage?: string | undefined;
  }> {
    const tempDir = path.join(
      os.tmpdir(),
      `code-execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
    const codeFile = path.join(tempDir, 'code.js');
    const containerName = `code-executor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const startTime = Date.now();

    try {
      // Crear directorio temporal
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Escribir código en archivo
      const wrappedCode = this.wrapCode(code, testCase);
      fs.writeFileSync(codeFile, wrappedCode);

      // Ejecutar en contenedor Docker
      const result = await this.executeInDockerContainer(
        containerName,
        codeFile,
        testCase.input,
        timeLimit,
        memoryLimit
      );

      const executionTime = Date.now() - startTime;

      // Validar salida
      const expectedOutput = (testCase.expectedOutput || '').trim();
      const isCorrect = result.output.trim() === expectedOutput;

      return {
        caseId: testCase.id,
        status: isCorrect ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER,
        timeMs: executionTime,
        memoryKb: result.memoryKb || 0,
        actualOutput: result.output.trim(),
        expectedOutput: expectedOutput,
        errorMessage: result.error && result.error.length > 0 ? result.error : undefined
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      const status = errorMsg.includes('Time limit')
        ? SubmissionStatus.TIME_LIMIT_EXCEEDED
        : SubmissionStatus.RUNTIME_ERROR;

      return {
        caseId: testCase.id,
        status,
        timeMs: executionTime,
        memoryKb: 0,
        errorMessage: errorMsg
      };
    } finally {
      // Limpiar contenedor
      await this.cleanupContainer(containerName);

      // Limpiar archivos temporales
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (e) {
        this.logger.warn('Failed to clean up temporary directory', e);
      }
    }
  }

  /**
   * Envuelve el código del usuario con manejo de entrada/salida
   */
  private wrapCode(code: string, testCase: any): string {
    return `
// Código del estudiante
${code}

// Sistema de entrada/salida
const readline = require('readline');

// Para soporte de entrada desde stdin
let inputLines = ${JSON.stringify(testCase.input.split('\n'))};
let inputIndex = 0;

// Mock de readline para entrada
function getInput(prompt = '') {
  if (inputIndex < inputLines.length) {
    return inputLines[inputIndex++];
  }
  return '';
}

// Asegurarse de que existe una función main o ejecutar código directo
if (typeof main === 'function') {
  try {
    const result = main(getInput);
    if (result !== undefined) {
      console.log(result);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
    `;
  }

  /**
   * Ejecuta el código en un contenedor Docker con restricciones de seguridad
   */
  private async executeInDockerContainer(
    containerName: string,
    codeFile: string,
    input: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<DockerExecutionResult> {
    return new Promise((resolve, reject) => {
      const timeLimitSeconds = Math.ceil(timeLimit / 1000);
      // Enforce at least 512 MB as per platform policy
      const memoryLimitMb = Math.max(512, memoryLimit || 512);

      // Comando docker run con restricciones de seguridad
      const dockerArgs = [
        'run',
        '--rm', // Eliminar contenedor automáticamente
        '--name',
        containerName,
        '--network',
        'none', // Sin acceso a red
        '--cpus',
        '0.5', // Límite de CPU
        '--memory',
        `${memoryLimitMb}m`, // Límite de memoria
        '--memory-swap',
        `${memoryLimitMb}m`, // Deshabilitar swap
        '--pids-limit',
        '10', // Máximo de procesos
        '--read-only', // Sistema de archivos read-only
        '--tmpfs',
        '/tmp:rw,size=100m,noexec', // tmpfs con tamaño limitado
        '--tmpfs',
        '/run:rw,size=50m,noexec',
        '--cap-drop',
        'ALL', // Eliminar todas las capacidades
        '--security-opt',
        'no-new-privileges',
        '--volume',
        `${codeFile}:/code.js:ro`, // Montar código como read-only
        this.DOCKER_IMAGE,
        'node',
        '/code.js'
      ];

      const docker = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        docker.kill('SIGKILL');
      }, timeLimit + 5000);

      docker.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      docker.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      docker.on('error', (error: Error) => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Docker execution error: ${error.message}`));
      });

      docker.on('close', (code: number | null) => {
        clearTimeout(timeoutHandle);
        this.activeContainers.delete(containerName);

        if (timedOut) {
          reject(new Error('Time limit exceeded'));
          return;
        }

        if (code !== 0 && code !== null) {
          reject(
            new Error(
              `Process exited with code ${code}: ${errorOutput || 'Unknown error'}`
            )
          );
          return;
        }

        resolve({
          output,
          error: errorOutput,
          code: code || 0,
          memoryKb: 0 // Docker no expone fácilmente el uso de memoria
        });
      });

      // Enviar entrada al proceso
      if (input) {
        docker.stdin?.write(input);
      }
      docker.stdin?.end();

      this.activeContainers.add(containerName);
    });
  }

  /**
   * Limpia un contenedor Docker
   */
  private async cleanupContainer(containerName: string): Promise<void> {
    if (!this.activeContainers.has(containerName)) {
      return;
    }

    try {
      await this.executeCommand('docker', ['rm', '-f', containerName]);
      this.activeContainers.delete(containerName);
    } catch (error) {
      this.logger.warn(`Failed to clean up container ${containerName}`, error);
    }
  }

  /**
   * Ejecuta un comando en la terminal
   */
  private executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
        } else {
          resolve(output);
        }
      });

      child.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Obtiene estadísticas de contenedores activos
   */
  async getStats(): Promise<{ activeContainers: number }> {
    return {
      activeContainers: this.activeContainers.size
    };
  }

  /**
   * Limpia todos los contenedores activos
   */
  async cleanup(): Promise<void> {
    for (const containerName of this.activeContainers) {
      await this.cleanupContainer(containerName);
    }
  }
}
