import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { SubmissionStatus } from '../domain/entities/Submission';

export class JavaRunner {
  async execute(config: RunnerConfig): Promise<RunnerResult> {
    const results: Array<any> = [];
    let totalTime = 0;
    let totalMem = 0;
    let passed = 0;

    for (const tc of config.testCases) {
      const r = await this.runTestCase(config, tc);
      results.push(r);
      totalTime += r.timeMs;
      totalMem += r.memoryKb;
      if (r.status === SubmissionStatus.ACCEPTED) passed++;
    }

    const score = config.testCases.length ? (passed / config.testCases.length) * 100 : 0;
    return {
      status: score === 100 ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER,
      score,
      timeMsTotal: totalTime,
      memoryKbTotal: totalMem,
      testCaseResults: results
    };
  }

  private async runTestCase(config: RunnerConfig, testCase: any): Promise<any> {
    const timeLimit = Math.max(100, config.timeLimit || 1500);
    // Enforce at least 512 MB as per platform policy
    const memoryLimitMb = Math.max(512, config.memoryLimit || 512);

    return new Promise((resolve) => {
      const start = Date.now();
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'java-run-'));
      const srcPath = path.join(tmpDir, 'Runner.java');

      const wrapped = [
        'import java.util.*;',
        'public class Runner {',
        '  // --- user code ---',
        config.code,
        '  // Expect a static method: String solve(String input)',
        '  public static void main(String[] args) throws Exception {',
        '    Scanner sc = new Scanner(System.in).useDelimiter("\\\\A");',
        '    String input = sc.hasNext() ? sc.next() : "";',
        '    try {',
        '      String out = solve(input);',
        '      System.out.print(out == null ? "" : out);',
        '    } catch (Exception e) {',
        '      System.err.print("__EXC__:" + e.getClass().getSimpleName() + ":" + e.getMessage());',
        '      System.exit(1);',
        '    }',
        '  }',
        '}'
      ].join('\n');

      try {
        fs.writeFileSync(srcPath, wrapped, 'utf8');

        const containerName = `java-run-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const args = [
          'run', '--rm', '--name', containerName,
          '--network', 'none',
          '--cpus', '0.5',
          '--memory', `${memoryLimitMb}m`,
          '--memory-swap', `${memoryLimitMb}m`,
          '--pids-limit', '10',
          '--read-only',
          '--tmpfs', '/tmp:rw,size=100m,noexec',
          '--tmpfs', '/run:rw,size=50m,noexec',
          '--cap-drop', 'ALL',
          '--security-opt', 'no-new-privileges',
          '--volume', `${srcPath}:/work/Runner.java:ro`,
          'openjdk:17-alpine',
          'sh', '-lc',
          `cp /work/Runner.java /tmp/Runner.java && cd /tmp && javac Runner.java 2>/tmp/err && timeout ${Math.ceil(timeLimit/1000)}s java Runner`
        ];

        const proc = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
        let out = ''; let err = ''; let killed = false;
        proc.stdout?.on('data', d => out += d.toString());
        proc.stderr?.on('data', d => err += d.toString());

        const killTimer = setTimeout(() => { killed = true; proc.kill('SIGKILL'); }, timeLimit + 500);

        proc.on('close', (code) => {
          clearTimeout(killTimer);
          const elapsed = Date.now() - start;
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

          if (killed) {
            resolve({ caseId: testCase.id, status: SubmissionStatus.TIME_LIMIT_EXCEEDED, timeMs: timeLimit, memoryKb: 0, errorMessage: 'Time limit exceeded' });
            return;
          }
          if (code !== 0) {
            resolve({
              caseId: testCase.id,
              status: err.includes('error:') ? SubmissionStatus.COMPILATION_ERROR : SubmissionStatus.RUNTIME_ERROR,
              timeMs: elapsed,
              memoryKb: 0,
              errorMessage: err || 'Non-zero exit code'
            });
          } else {
            const actual = (out || '').trim();
            const expected = (testCase.expectedOutput || '').trim();
            const ok = actual === expected;
            resolve({ caseId: testCase.id, status: ok ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER, timeMs: elapsed, memoryKb: 0, actualOutput: actual, expectedOutput: expected });
          }
        });

        proc.on('error', (e) => {
          clearTimeout(killTimer);
          const elapsed = Date.now() - start;
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          resolve({ caseId: testCase.id, status: SubmissionStatus.RUNTIME_ERROR, timeMs: elapsed, memoryKb: 0, errorMessage: e.message });
        });

        // feed stdin
        proc.stdin?.write(testCase.input ?? '');
        proc.stdin?.end();
      } catch (e: any) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        resolve({ caseId: testCase.id, status: SubmissionStatus.RUNTIME_ERROR, timeMs: 0, memoryKb: 0, errorMessage: e?.message || 'Unknown error' });
      }
    });
  }
}

