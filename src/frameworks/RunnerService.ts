// src/frameworks/RunnerService.ts
import { ContainerCodeExecutor } from './ContainerCodeExecutor';
import {
  IRunnerService,
  RunnerConfig,
  RunnerResult,
} from '../domain/services/IRunnerService';
import {
  ProgrammingLanguage,
  SubmissionStatus,
} from '../domain/entities/Submission';
import { Logger } from './Logger';
import { PythonRunner } from '../runners/python-runner';
import { CppRunner } from '../runners/cpp-runner';
import { JavaRunner } from '../runners/java-runner';

/**
 * RunnerService: coordinador principal de ejecución de código.
 * Usa ContainerCodeExecutor para JS y runners específicos para otros lenguajes.
 */
export class RunnerService implements IRunnerService {
  private logger: Logger;
  private containerExecutor: ContainerCodeExecutor;
  private pythonRunner: PythonRunner;
  private cppRunner: CppRunner;
  private javaRunner: JavaRunner;

  private readonly supportedLanguages: ProgrammingLanguage[] = [
    ProgrammingLanguage.PYTHON,
    ProgrammingLanguage.JAVASCRIPT,
    ProgrammingLanguage.CPP,
    ProgrammingLanguage.JAVA,
  ];

  constructor() {
    this.logger = new Logger('RunnerService');
    this.containerExecutor = new ContainerCodeExecutor();
    this.pythonRunner = new PythonRunner();
    this.cppRunner = new CppRunner();
    this.javaRunner = new JavaRunner();
  }

  /**
   * Método principal usado por los casos de uso.
   */
  async execute(config: RunnerConfig): Promise<RunnerResult> {
    if (!this.isLanguageSupported(config.language)) {
      return {
        status: SubmissionStatus.COMPILATION_ERROR,
        score: 0,
        timeMsTotal: 0,
        memoryKbTotal: 0,
        testCaseResults: [],
        errorMessage: `Language ${config.language} is not supported`,
      };
    }

    try {
      this.logger.info(
        `Executing ${config.language} code with ${config.testCases.length} test cases`,
      );

      switch (config.language) {
        case ProgrammingLanguage.JAVASCRIPT:
          return await this.containerExecutor.executeCode(config);

        case ProgrammingLanguage.PYTHON:
          return await this.pythonRunner.execute(config);

        case ProgrammingLanguage.CPP:
          return await this.cppRunner.execute(config);

        case ProgrammingLanguage.JAVA:
          return await this.javaRunner.execute(config);

        default:
          return {
            status: SubmissionStatus.COMPILATION_ERROR,
            score: 0,
            timeMsTotal: 0,
            memoryKbTotal: 0,
            testCaseResults: [],
            errorMessage: `Execution not implemented for ${config.language}`,
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
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isLanguageSupported(language: ProgrammingLanguage): boolean {
    return this.supportedLanguages.includes(language);
  }

  getSupportedLanguages(): ProgrammingLanguage[] {
    return [...this.supportedLanguages];
  }

  async getRunnerStats(): Promise<{
    activeRunners: number;
    totalExecutions: number;
    averageExecutionTime: number;
  }> {
    const stats = await this.containerExecutor.getStats();
    return {
      activeRunners: stats.activeContainers,
      totalExecutions: 0,
      averageExecutionTime: 0,
    };
  }

  async cleanup(): Promise<void> {
    await this.containerExecutor.cleanup();
  }
}
