// src/frameworks/ContainerCodeExecutor.ts
import { spawn } from 'child_process';
import {
  RunnerConfig,
  RunnerResult,
} from '../domain/services/IRunnerService';
import { SubmissionStatus } from '../domain/entities/Submission';
import { Logger } from './Logger';

export class ContainerCodeExecutor {
  private readonly logger = new Logger('ContainerCodeExecutor');

  /**
   * Ejecuta código JavaScript dentro del propio contenedor de la API.
   * Espera una función `main(input: string): string`.
   */
  async executeCode(config: RunnerConfig): Promise<RunnerResult> {
    if (config.language !== 'javascript') {
      return {
        status: SubmissionStatus.COMPILATION_ERROR,
        score: 0,
        timeMsTotal: 0,
        memoryKbTotal: 0,
        testCaseResults: [],
        errorMessage:
          'ContainerCodeExecutor only supports javascript for now',
      };
    }

    const results: any[] = [];
    let totalTime = 0;

    for (const tc of config.testCases) {
      const start = Date.now();
      const res = await this.runSingleTest(config.code, tc.input);
      const elapsed = Date.now() - start;

      totalTime += elapsed;

      results.push({
        caseId: tc.id,
        status: res.ok
          ? SubmissionStatus.ACCEPTED
          : SubmissionStatus.WRONG_ANSWER,
        timeMs: elapsed,
        memoryKb: 0,
        actualOutput: res.output,
        expectedOutput: tc.expectedOutput,
        errorMessage: res.error,
      });
    }

    const passed = results.filter(
      (r) => r.status === SubmissionStatus.ACCEPTED,
    ).length;
    const score = config.testCases.length
      ? (passed / config.testCases.length) * 100
      : 0;

    const overallStatus =
      score === 100
        ? SubmissionStatus.ACCEPTED
        : SubmissionStatus.WRONG_ANSWER;

    return {
      status: overallStatus,
      score,
      timeMsTotal: totalTime,
      memoryKbTotal: 0,
      testCaseResults: results,
    };
  }

  /**
   * Stub para estadísticas (para RunnerService.getRunnerStats)
   */
  async getStats(): Promise<{ activeContainers: number }> {
    // si luego añades lógica de colas/containers, actualiza esto
    return { activeContainers: 0 };
  }

  async cleanup(): Promise<void> {
    // por ahora no hay recursos que limpiar
  }

  private runSingleTest(
    code: string,
    input: string,
  ): Promise<{ ok: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const wrapped = `
        ${code}
        (async () => {
          try {
            const res = await (typeof main === 'function' ? main(${JSON.stringify(
              input,
            )}) : '');
            console.log(String(res ?? ''));
          } catch (e) {
            console.error('__ERR__:' + (e && e.message ? e.message : String(e)));
            process.exit(1);
          }
        })();
      `;

      // tipamos como any para no pelear con tipos de NodeJS.ChildProcess
      const child: any = spawn('node', ['-e', wrapped], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d: Buffer) => {
        stdout += d.toString();
      });

      child.stderr?.on('data', (d: Buffer) => {
        stderr += d.toString();
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve({ ok: true, output: stdout.trim() });
        } else {
          let errMsg: string | undefined;
          const marker = '__ERR__:';
          if (stderr.includes(marker)) {
            const parts = stderr.split(marker);
            const tail = parts[1] ?? '';
            errMsg = tail.trim() || 'Unknown error';
          } else {
            errMsg = stderr.trim() || 'Non-zero exit code';
          }

          resolve({
            ok: false,
            output: stdout.trim(),
            error: errMsg,
          });
        }
      });
    });
  }
}
