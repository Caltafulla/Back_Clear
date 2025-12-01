import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { Logger } from '../frameworks/Logger';
import { SubmissionStatus, TestCaseResult } from '../domain/entities/Submission';

export class PythonRunner {
  private logger = new Logger('PythonRunner');

  async execute(config: RunnerConfig): Promise<RunnerResult> {
    this.logger.info(
      `PythonRunner: ejecutando ${config.testCases.length} casos de prueba`
    );

    const testResults: TestCaseResult[] = [];
    let overallStatus: SubmissionStatus = SubmissionStatus.ACCEPTED;
    let totalTime = 0;

    for (const tc of config.testCases) {
      const result = await this.runSingleTest(
        config.code,
        tc.input,
        tc.expectedOutput,
        tc.id,
        config.timeLimit
      );

      testResults.push(result);
      totalTime += result.timeMs;

      if (result.status !== SubmissionStatus.ACCEPTED) {
        overallStatus =
          result.status === SubmissionStatus.RUNTIME_ERROR
            ? SubmissionStatus.RUNTIME_ERROR
            : SubmissionStatus.WRONG_ANSWER;
      }
    }

    const firstError = testResults.find(
      (t) => t.status !== SubmissionStatus.ACCEPTED
    );

    return {
      status: overallStatus,
      score: overallStatus === SubmissionStatus.ACCEPTED ? 100 : 0,
      timeMsTotal: totalTime,
      memoryKbTotal: 0,
      testCaseResults: testResults,
      errorMessage: firstError?.errorMessage ?? '', // <-- SIEMPRE STRING
    };
  }

  private async runSingleTest(
    code: string,
    input: string,
    expectedOutput: string,
    caseId: string,
    timeLimitMs: number
  ): Promise<TestCaseResult> {
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, `code_${caseId}.py`);

    await fs.writeFile(filePath, code, 'utf8');

    return new Promise<TestCaseResult>((resolve) => {
      const proc = spawn('python3', [filePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.stdin.write(input ?? '');
      proc.stdin.end();

      const start = Date.now();

      const timeout = setTimeout(() => {
        this.logger.warn(`Python test ${caseId} timed out`);
        proc.kill('SIGKILL');
        resolve({
          caseId,
          status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
          timeMs: timeLimitMs,
          memoryKb: 0,
          actualOutput: stdout.trim(),
          expectedOutput,
          errorMessage: 'Time limit exceeded',
        });
      }, timeLimitMs);

      proc.on('close', (exitCode) => {
        clearTimeout(timeout);

        const elapsed = Date.now() - start;
        const actual = stdout.trim();
        const expected = (expectedOutput ?? '').trim();

        if (exitCode !== 0) {
          resolve({
            caseId,
            status: SubmissionStatus.RUNTIME_ERROR,
            timeMs: elapsed,
            memoryKb: 0,
            actualOutput: actual,
            expectedOutput: expected,
            errorMessage: stderr || `Process exited with code ${exitCode}`,
          });
          return;
        }

        // Normalize JSON strings before comparison
        const normalizeOutput = (output: string): string => {
          try {
            // Try to parse as JSON and re-stringify to normalize
            const parsed = JSON.parse(output);
            return JSON.stringify(parsed);
          } catch {
            // If not JSON, just trim
            return output.trim();
          }
        };

        const normalizedActual = normalizeOutput(actual);
        const normalizedExpected = normalizeOutput(expected);
        const isCorrect = normalizedActual === normalizedExpected;

        resolve({
          caseId,
          status: isCorrect
            ? SubmissionStatus.ACCEPTED
            : SubmissionStatus.WRONG_ANSWER,
          timeMs: elapsed,
          memoryKb: 0,
          actualOutput: actual,
          expectedOutput: expected,
          errorMessage: isCorrect ? '' : 'Output did not match expected', // <-- también string
        });
      });
    });
  }
}
