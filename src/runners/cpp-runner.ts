import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { SubmissionStatus } from '../domain/entities/Submission';

export class CppRunner {
  async execute(config: RunnerConfig): Promise<RunnerResult> {
    const testCaseResults: Array<any> = [];
    let totalTime = 0;
    let totalMemory = 0;
    let passed = 0;

    for (const testCase of config.testCases) {
      const res = await this.runTestCase(config, testCase);
      testCaseResults.push(res);
      totalTime += res.timeMs;
      totalMemory += res.memoryKb;
      if (res.status === SubmissionStatus.ACCEPTED) passed++;
    }

    const score = config.testCases.length ? (passed / config.testCases.length) * 100 : 0;
    return {
      status: score === 100 ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER,
      score,
      timeMsTotal: totalTime,
      memoryKbTotal: totalMemory,
      testCaseResults
    };
  }

  private async runTestCase(config: RunnerConfig, testCase: any): Promise<any> {
    const timeLimit = Math.max(100, config.timeLimit || 1500);
    // Enforce at least 512 MB as per platform policy
    const memoryLimitMb = Math.max(512, config.memoryLimit || 512);

    return new Promise((resolve) => {
      const start = Date.now();

      // Prepare temp dir and source
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp-run-'));
      const srcPath = path.join(tmpDir, 'code.cpp');

      const wrapped = [
        '#include <bits/stdc++.h>',
        'using namespace std;',
        '// --- user code ---',
        config.code,
        '// --- runner wrapper ---',
        'string solve(string input);',
        'int main(){',
        '  ios::sync_with_stdio(false); cin.tie(nullptr);',
        '  string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());',
        '  try {',
        '    string out = solve(input);',
        '    cout << out;',
        '  } catch(const exception& e){',
        '    cerr << "__EXC__:" << e.what();',
        '    return 1;',
        '  }',
        '  return 0;',
        '}'
      ].join('\n');

      try {
        fs.writeFileSync(srcPath, wrapped, 'utf8');

        const containerName = `cpp-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
          '--volume', `${srcPath}:/work/code.cpp:ro`,
          'gcc:13',
          'sh', '-lc',
          `cp /work/code.cpp /tmp/code.cpp && g++ -std=c++17 -O2 -pipe -static -s -o /tmp/a.out /tmp/code.cpp 2>/tmp/err && timeout ${Math.ceil(timeLimit/1000)}s /tmp/a.out`
        ];

        const docker = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
        let out = ''; let err = ''; let killed = false;

        docker.stdout?.on('data', d => out += d.toString());
        docker.stderr?.on('data', d => err += d.toString());

        const killTimer = setTimeout(() => { killed = true; docker.kill('SIGKILL'); }, timeLimit + 500);

        docker.on('close', (code) => {
          clearTimeout(killTimer);
          const elapsed = Date.now() - start;
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

          if (killed) {
            resolve({ caseId: testCase.id, status: SubmissionStatus.TIME_LIMIT_EXCEEDED, timeMs: timeLimit, memoryKb: 0, errorMessage: 'Time limit exceeded' });
            return;
          }

          if (code !== 0) {
            // Try to read compile errors
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
            resolve({
              caseId: testCase.id,
              status: ok ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER,
              timeMs: elapsed,
              memoryKb: 0,
              actualOutput: actual,
              expectedOutput: expected
            });
          }
        });

        docker.on('error', (e) => {
          clearTimeout(killTimer);
          const elapsed = Date.now() - start;
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          resolve({ caseId: testCase.id, status: SubmissionStatus.RUNTIME_ERROR, timeMs: elapsed, memoryKb: 0, errorMessage: e.message });
        });

        // feed stdin
        docker.stdin?.write(testCase.input ?? '');
        docker.stdin?.end();
      } catch (e: any) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        resolve({ caseId: testCase.id, status: SubmissionStatus.RUNTIME_ERROR, timeMs: 0, memoryKb: 0, errorMessage: e?.message || 'Unknown error' });
      }
    });
  }
}

