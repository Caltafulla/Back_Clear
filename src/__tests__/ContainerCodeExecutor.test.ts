/**
 * Tests para ContainerCodeExecutor
 * 
 * Nota: Estos tests requieren Docker funcionando
 */

import { ContainerCodeExecutor } from '../frameworks/ContainerCodeExecutor';
import { RunnerConfig } from '../domain/services/IRunnerService';
import { ProgrammingLanguage, SubmissionStatus } from '../domain/entities/Submission';

describe('ContainerCodeExecutor', () => {
  let executor: ContainerCodeExecutor;

  beforeAll(() => {
    executor = new ContainerCodeExecutor();
  });

  afterAll(async () => {
    // Limpiar todos los contenedores activos
    await executor.cleanup();
  });

  describe('executeCode', () => {
    it('debería ejecutar un código simple correctamente', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            const n = parseInt(getInput());
            return n * 2;
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: '5',
            expectedOutput: '10',
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.status).toBe(SubmissionStatus.ACCEPTED);
      expect(result.score).toBe(100);
      expect(result.testCaseResults).toHaveLength(1);
      expect(result.testCaseResults[0].status).toBe(SubmissionStatus.ACCEPTED);
      expect(result.testCaseResults[0].actualOutput).toBe('10');
    });

    it('debería detectar salida incorrecta', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            const n = parseInt(getInput());
            return n * 3; // Error: debería ser n * 2
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: '5',
            expectedOutput: '10',
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.status).toBe(SubmissionStatus.WRONG_ANSWER);
      expect(result.score).toBe(0);
      expect(result.testCaseResults[0].status).toBe(SubmissionStatus.WRONG_ANSWER);
      expect(result.testCaseResults[0].actualOutput).toBe('15');
    });

    it('debería manejar errores de tiempo de ejecución', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            const obj = null;
            return obj.property; // TypeError
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: 'ignored',
            expectedOutput: 'any',
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.status).toBe(SubmissionStatus.RUNTIME_ERROR);
      expect(result.score).toBe(0);
      expect(result.testCaseResults[0].status).toBe(SubmissionStatus.RUNTIME_ERROR);
      expect(result.testCaseResults[0].errorMessage).toBeDefined();
    });

    it('debería ejecutar múltiples casos de prueba', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            const n = parseInt(getInput());
            return n * 2;
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: '5',
            expectedOutput: '10',
            isHidden: false
          },
          {
            id: 'test-2',
            input: '3',
            expectedOutput: '6',
            isHidden: false
          },
          {
            id: 'test-3',
            input: '0',
            expectedOutput: '0',
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.testCaseResults).toHaveLength(3);
      expect(result.score).toBe(100);
      expect(result.testCaseResults.every((tc: any) => tc.status === SubmissionStatus.ACCEPTED)).toBe(
        true
      );
    });

    it('debería procesar parcialmente casos fallidos', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            const n = parseInt(getInput());
            return n > 5 ? n * 2 : n * 3; // Lógica incorrecta
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: '3',
            expectedOutput: '6', // Obtiene 9
            isHidden: false
          },
          {
            id: 'test-2',
            input: '10',
            expectedOutput: '20', // Correcto
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.score).toBe(50);
      expect(result.status).toBe(SubmissionStatus.WRONG_ANSWER);
      expect(result.testCaseResults[0].status).toBe(SubmissionStatus.WRONG_ANSWER);
      expect(result.testCaseResults[1].status).toBe(SubmissionStatus.ACCEPTED);
    });

    it('debería capturar tiempo de ejecución', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `
          function main(getInput) {
            // Función que realiza algunas operaciones
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
              sum += i;
            }
            return getInput();
          }
        `,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: 'output',
            expectedOutput: 'output',
            isHidden: false
          }
        ]
      };

      const result = await executor.executeCode(config);

      expect(result.testCaseResults[0].timeMs).toBeGreaterThan(0);
      expect(result.timeMsTotal).toBeGreaterThan(0);
    });

    it('debería limpiar recursos después de la ejecución', async () => {
      const config: RunnerConfig = {
        language: ProgrammingLanguage.JAVASCRIPT,
        code: `function main(getInput) { return getInput(); }`,
        timeLimit: 5000,
        memoryLimit: 512,
        testCases: [
          {
            id: 'test-1',
            input: 'test',
            expectedOutput: 'test',
            isHidden: false
          }
        ]
      };

      const stats1 = await executor.getStats();
      const initialContainers = stats1.activeContainers;

      await executor.executeCode(config);

      const stats2 = await executor.getStats();
      expect(stats2.activeContainers).toBeLessThanOrEqual(initialContainers);
    });
  });

  describe('getStats', () => {
    it('debería retornar estadísticas', async () => {
      const stats = await executor.getStats();

      expect(stats).toHaveProperty('activeContainers');
      expect(typeof stats.activeContainers).toBe('number');
      expect(stats.activeContainers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanup', () => {
    it('debería limpiar sin errores', async () => {
      await expect(executor.cleanup()).resolves.not.toThrow();
    });
  });
});
