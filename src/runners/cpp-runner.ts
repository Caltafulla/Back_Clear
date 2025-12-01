import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import { RunnerConfig, RunnerResult } from "../domain/services/IRunnerService";
import { Logger } from "../frameworks/Logger";
import { SubmissionStatus, TestCaseResult } from "../domain/entities/Submission";

export class CppRunner {
  private logger = new Logger("CppRunner");

  async execute(config: RunnerConfig): Promise<RunnerResult> {
    this.logger.info(
      `CppRunner: ejecutando ${config.testCases.length} casos de prueba`
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

    return {
      status: overallStatus,
      score: overallStatus === SubmissionStatus.ACCEPTED ? 100 : 0,
      timeMsTotal: totalTime,
      memoryKbTotal: 0,
      testCaseResults: testResults,
      errorMessage:
        testResults.find((t) => t.status !== SubmissionStatus.ACCEPTED)
          ?.errorMessage || "",
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

    const baseName = `code_${caseId}_${Date.now()}`;
    const codePath = path.join(tmpDir, `${baseName}.cpp`);
    const exePath = path.join(tmpDir, `${baseName}.out`);

    // 1) Guardar código fuente
    await fs.writeFile(codePath, code, "utf8");

    // 2) Compilar
    const compiledOk = await new Promise<boolean>((resolve) => {
      const compiler = spawn("g++", [codePath, "-O2", "-std=c++17", "-o", exePath]);

      compiler.on("close", (exitCode) => {
        resolve(exitCode === 0);
      });
    });

    if (!compiledOk) {
      this.logger.error(`C++ compilation failed for case ${caseId}`);
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

    // 3) Ejecutar el binario pasando el input con echo | exe
    return await new Promise<TestCaseResult>((resolve) => {
      // escapamos comillas simples básicas (nuestros inputs son números y espacios,
      // pero por si acaso)
      const safeInput = (input ?? "").replace(/'/g, "'\"'\"'");
      const command = `echo '${safeInput}' | "${exePath}"`;

      const proc = spawn("sh", ["-c", command], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      const start = Date.now();

      const timeout = setTimeout(() => {
        this.logger.warn(`C++ test ${caseId} timed out`);
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
            errorMessage: stderr || `Exited with code ${exitCode}`,
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
          errorMessage: isCorrect ? "" : "Output mismatch",
        });
      });
    });
  }
}
