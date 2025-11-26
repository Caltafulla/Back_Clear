import { ContainerCodeExecutor } from './ContainerCodeExecutor';
import { IRunnerService, RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { ProgrammingLanguage, SubmissionStatus } from '../domain/entities/Submission';
import { Logger } from './Logger';

/**
 * RunnerService: Coordinador principal de ejecución de código
 * 
 * Características:
 * - Soporta múltiples lenguajes (JavaScript, TypeScript, Python, C++, Java)
 * - Ejecuta código en contenedores Docker aislados con restricciones de seguridad
 * - Límites de CPU, memoria y tiempo
 * - Sistema de archivos read-only
 * - Sin acceso a red
 */
export class RunnerService implements IRunnerService {
  private logger: Logger;
  private containerExecutor: ContainerCodeExecutor;
  private readonly supportedLanguages: ProgrammingLanguage[] = [
    ProgrammingLanguage.PYTHON,
    ProgrammingLanguage.JAVASCRIPT,
    ProgrammingLanguage.CPP,
    ProgrammingLanguage.JAVA
  ];

  constructor() {
    this.logger = new Logger('RunnerService');
    this.containerExecutor = new ContainerCodeExecutor();
  }

  /**
   * Ejecuta código basado en el lenguaje especificado
   */
  async executeCode(config: RunnerConfig): Promise<RunnerResult> {
    if (!this.isLanguageSupported(config.language)) {
      return {
        status: SubmissionStatus.COMPILATION_ERROR,
        score: 0,
        timeMsTotal: 0,
        memoryKbTotal: 0,
        testCaseResults: [],
        errorMessage: `Language ${config.language} is not supported`
      };
    }

    try {
      this.logger.info(`Executing ${config.language} code with ${config.testCases.length} test cases`);

      // Para JavaScript/TypeScript, usar el contenedor Docker
      if (config.language === ProgrammingLanguage.JAVASCRIPT) {
        return await this.containerExecutor.executeCode(config);
      }

      // Para otros lenguajes, usar ejecutores específicos (a implementar)
      switch (config.language) {
        case ProgrammingLanguage.PYTHON:
          return await this.executePython(config);
        case ProgrammingLanguage.CPP:
          return await this.executeCpp(config);
        case ProgrammingLanguage.JAVA:
          return await this.executeJava(config);
        default:
          return {
            status: SubmissionStatus.COMPILATION_ERROR,
            score: 0,
            timeMsTotal: 0,
            memoryKbTotal: 0,
            testCaseResults: [],
            errorMessage: `Execution not yet implemented for ${config.language}`
          };
      }
    } catch (error) {
      this.logger.error('Error executing code', error);
      return {
        status: SubmissionStatus.RUNTIME_ERROR,
        score: 0,
        timeMsTotal: 0,
        memoryKbTotal: 0,
        testCaseResults: [],
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ejecuta código Python (a implementar con contenedores)
   */
  private async executePython(config: RunnerConfig): Promise<RunnerResult> {
    // TODO: Implementar ejecución de Python en contenedores
    return {
      status: SubmissionStatus.COMPILATION_ERROR,
      score: 0,
      timeMsTotal: 0,
      memoryKbTotal: 0,
      testCaseResults: [],
      errorMessage: 'Python execution not yet implemented'
    };
  }

  /**
   * Ejecuta código C++ (a implementar con contenedores)
   */
  private async executeCpp(config: RunnerConfig): Promise<RunnerResult> {
    // TODO: Implementar ejecución de C++ en contenedores
    return {
      status: SubmissionStatus.COMPILATION_ERROR,
      score: 0,
      timeMsTotal: 0,
      memoryKbTotal: 0,
      testCaseResults: [],
      errorMessage: 'C++ execution not yet implemented'
    };
  }

  /**
   * Ejecuta código Java (a implementar con contenedores)
   */
  private async executeJava(config: RunnerConfig): Promise<RunnerResult> {
    // TODO: Implementar ejecución de Java en contenedores
    return {
      status: SubmissionStatus.COMPILATION_ERROR,
      score: 0,
      timeMsTotal: 0,
      memoryKbTotal: 0,
      testCaseResults: [],
      errorMessage: 'Java execution not yet implemented'
    };
  }

  /**
   * Verifica si un lenguaje es soportado
   */
  isLanguageSupported(language: ProgrammingLanguage): boolean {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Retorna lista de lenguajes soportados
   */
  getSupportedLanguages(): ProgrammingLanguage[] {
    return [...this.supportedLanguages];
  }

  /**
   * Obtiene estadísticas del servicio de ejecución
   */
  async getRunnerStats(): Promise<{
    activeRunners: number;
    totalExecutions: number;
    averageExecutionTime: number;
  }> {
    const stats = await this.containerExecutor.getStats();
    return {
      activeRunners: stats.activeContainers,
      totalExecutions: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Limpia recursos
   */
  async cleanup(): Promise<void> {
    await this.containerExecutor.cleanup();
  }
}

