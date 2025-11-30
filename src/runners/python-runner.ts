// src/runners/python-runner.ts
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import {
  SubmissionStatus,
  TestCaseResult,
} from '../domain/entities/Submission';

export class PythonRunner {
  async execute(config: RunnerConfig): Promise<RunnerResult> {
    const testCaseResults: TestCaseResult[] = [];
    let totalTime = 0;
    let totalMemory = 0;
    let passedTests = 0;

    for (const testCase of config.testCases) {
      const result = await this.runTestCase(config, testCase);
      testCaseResults.push(result);
      totalTime += result.timeMs;
      totalMemory += result.memoryKb;
      if (result.status === SubmissionStatus.ACCEPTED) {
        passedTests++;
      }
    }

    const score =
      config.testCases.length > 0
        ? (passedTests / config.testCases.length) * 100
        : 0;
    const status =
      score === 100
        ? SubmissionStatus.ACCEPTED
        : SubmissionStatus.WRONG_ANSWER;

    return {
      status,
      score,
      timeMsTotal: totalTime,
      memoryKbTotal: totalMemory,
      testCaseResults,
    };
  }

  private async runTestCase(
    config: RunnerConfig,
    testCase: any,
  ): Promise<TestCaseResult> {
    const timeLimit = Math.max(100, config.timeLimit || 1500);
    const memoryLimitMb = Math.max(512, config.memoryLimit || 512);

    return new Promise((resolve) => {
      const startTime = Date.now();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'py-run-'));
      const srcPath = path.join(tmpDir, 'code.py');

      const wrappedCode = [
        'import sys',
        '# --- user code ---',
        config.code,
        '# --- runner wrapper ---',
        'if __name__ == "__main__":',
        '    data = sys.stdin.read()',
        '    try:',
        '        out = main(data.strip())',
        '    except Exception as e:',
        '        sys.stderr.write(f"__EXC__:{type(e).__name__}:{str(e)}")',
        '        sys.exit(1)',
        '    if out is None:',
        '        out = ""',
        '    sys.stdout.write(str(out))',
      ].join('\n');

      try {
        fs.writeFileSync(srcPath, wrappedCode, 'utf8');

        const containerName = `py-run-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const args = [
          'run',
          '--rm',
          '--name',
          containerName,
          '--network',
          'none',
          '--cpus',
          '0.5',
          '--memory',
          `${memoryLimitMb}m`,
          '--memory-swap',
          `${memoryLimitMb}m`,
          '--pids-limit',
          '10',
          '--read-only',
          '--tmpfs',
          '/tmp:rw,size=100m,noexec',
          '--tmpfs',
          '/run:rw,size=50m,noexec',
          '--cap-drop',
          'ALL',
          '--security-opt',
          'no-new-privileges',
          '--volume',
          `${srcPath}:/code.py:ro`,
          'python:3.10-alpine',
          'python',
          '/code.py',
        ];

        const docker = spawn('docker', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let error = '';
        let killedByTimeout = false;

        docker.stdout?.on('data', (data) => {
          output += data.toString();
        });

        docker.stderr?.on('data', (data) => {
          error += data.toString();
        });

        const timeoutHandle = setTimeout(() => {
          killedByTimeout = true;
          docker.kill('SIGKILL');
        }, timeLimit + 500);

        docker.on('close', (code) => {
          clearTimeout(timeoutHandle);
          const endTime = Date.now();
          const executionTime = endTime - startTime;

          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}

          if (killedByTimeout) {
            resolve({
              caseId: String(testCase.id),
              status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
              timeMs: timeLimit,
              memoryKb: 0,
              errorMessage: 'Time limit exceeded',
              actualOutput: '',
              expectedOutput: testCase.expectedOutput,
            });
            return;
          }

          if (code !== 0) {
            resolve({
              caseId: String(testCase.id),
              status: SubmissionStatus.RUNTIME_ERROR,
              timeMs: executionTime,
              memoryKb: 0,
              errorMessage:
                error || 'Non-zero exit code',
              actualOutput: '',
              expectedOutput: testCase.expectedOutput,
            });
          } else {
            const actual = (output || '').trim();
            const expected = (testCase.expectedOutput || '').trim();
            const ok = actual === expected;
            resolve({
              caseId: String(testCase.id),
              status: ok
                ? SubmissionStatus.ACCEPTED
                : SubmissionStatus.WRONG_ANSWER,
              timeMs: executionTime,
              memoryKb: 0,
              actualOutput: actual,
              expectedOutput: expected,
            });
          }
        });

        docker.on('error', (err) => {
          clearTimeout(timeoutHandle);
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
          } catch {}

          resolve({
            caseId: String(testCase.id),
            status: SubmissionStatus.RUNTIME_ERROR,
            timeMs: executionTime,
            memoryKb: 0,
            errorMessage: err.message,
            actualOutput: '',
            expectedOutput: testCase.expectedOutput,
          });
        });

        docker.stdin?.write(testCase.input ?? '');
        docker.stdin?.end();
      } catch (err: any) {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
        resolve({
          caseId: String(testCase.id),
          status: SubmissionStatus.RUNTIME_ERROR,
          timeMs: 0,
          memoryKb: 0,
          errorMessage: err?.message || 'Unknown error',
          actualOutput: '',
          expectedOutput: testCase.expectedOutput,
        });
      }
    });
  }
}
