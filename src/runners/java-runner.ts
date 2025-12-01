import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { RunnerConfig, RunnerResult } from "../domain/services/IRunnerService";
import { Logger } from "../frameworks/Logger";
import { SubmissionStatus, TestCaseResult } from "../domain/entities/Submission";

export class JavaRunner {
  private logger = new Logger("JavaRunner");

  async execute(config: RunnerConfig): Promise<RunnerResult> {
    this.logger.info(
      `JavaRunner: ejecutando ${config.testCases.length} casos de prueba`
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
        // si hay cualquier cosa distinta de ACCEPTED, nos quedamos con ese estado
        overallStatus = result.status;
      }
    }

    return {
      status: overallStatus,
      score: overallStatus === SubmissionStatus.ACCEPTED ? 100 : 0,
      timeMsTotal: totalTime,
      memoryKbTotal: 0,
      testCaseResults: testResults,
      errorMessage: testResults.find(t => t.status !== SubmissionStatus.ACCEPTED)
        ?.errorMessage,
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
    const codePath = path.join(tmpDir, "Main.java");
    const classPath = tmpDir; // .class va a quedar también en tmp

    // guardar código del usuario
    await fs.writeFile(codePath, code, "utf8");

    // --- COMPILAR JAVA DIRECTAMENTE CON `javac` ---
    const compileOk = await new Promise<boolean>((resolve) => {
      const proc = spawn("javac", ["-classpath", classPath, codePath]);

      proc.on("close", (exitCode) => {
        resolve(exitCode === 0);
      });
    });

    if (!compileOk) {
      return {
        caseId,
        status: SubmissionStatus.COMPILATION_ERROR,
        timeMs: 0,
        memoryKb: 0,
        actualOutput: "",
        expectedOutput,
        errorMessage: "Compilation failed",
      };
    }

    // --- EJECUTAR JAVA ---
    return await new Promise<TestCaseResult>((resolve) => {
      const start = Date.now();

      const proc = spawn("java", ["-classpath", classPath, "Main"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
      proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));

      proc.stdin.write(input ?? "");
      proc.stdin.end();

      const timeout = setTimeout(() => {
        this.logger.warn(`Java test ${caseId} timed out`);
        proc.kill("SIGKILL");
        resolve({
          caseId,
          status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
          timeMs: timeLimitMs,
          memoryKb: 0,
          actualOutput: stdout.trim(),
          expectedOutput,
          errorMessage: "Time limit exceeded",
        });
      }, timeLimitMs);

      proc.on("close", (exitCode) => {
        clearTimeout(timeout);
        const elapsed = Date.now() - start;

        const actual = stdout.trim();
        const expected = (expectedOutput ?? "").trim();

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

        const isCorrect = actual === expected;

        resolve({
          caseId,
          status: isCorrect
            ? SubmissionStatus.ACCEPTED
            : SubmissionStatus.WRONG_ANSWER,
          timeMs: elapsed,
          memoryKb: 0,
          actualOutput: actual,
          expectedOutput: expected,
          errorMessage: isCorrect ? undefined : "Output mismatch",
        });
      });
    });
  }
}
