import { spawn } from 'child_process';
import { IRunnerService, RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { ProgrammingLanguage, SubmissionStatus } from '../domain/entities/Submission';

export class RunnerService implements IRunnerService {
  private readonly supportedLanguages: ProgrammingLanguage[] = [
    ProgrammingLanguage.PYTHON,
    ProgrammingLanguage.JAVASCRIPT,
    ProgrammingLanguage.CPP,
    ProgrammingLanguage.JAVA
  ];

  async executeCode(config: RunnerConfig): Promise<RunnerResult> {
    if (!this.isLanguageSupported(config.language)) {
      throw new Error(`Language ${config.language} is not supported`);
    }

    try {
      switch (config.language) {
        case ProgrammingLanguage.PYTHON:
          return await this.executePython(config);
        case ProgrammingLanguage.JAVASCRIPT:
          return await this.executeJavaScript(config);
        case ProgrammingLanguage.CPP:
          return await this.executeCpp(config);
        case ProgrammingLanguage.JAVA:
          return await this.executeJava(config);
        default:
          throw new Error(`Execution not implemented for ${config.language}`);
      }
    } catch (error) {
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

  private async executePython(config: RunnerConfig): Promise<RunnerResult> {
    const testCaseResults = [];
    let totalTime = 0;
    let totalMemory = 0;
    let passedTests = 0;

    for (const testCase of config.testCases) {
      const result = await this.runPythonTestCase(config.code, testCase, config.timeLimit);
      testCaseResults.push(result);
      totalTime += result.timeMs;
      totalMemory += result.memoryKb;
      
      if (result.status === 'OK') {
        passedTests++;
      }
    }

    const score = config.testCases.length > 0 ? (passedTests / config.testCases.length) * 100 : 0;
    const status = score === 100 ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;

    return {
      status,
      score,
      timeMsTotal: totalTime,
      memoryKbTotal: totalMemory,
      testCaseResults
    };
  }

  private async executeJavaScript(config: RunnerConfig): Promise<RunnerResult> {
    // Similar implementation for JavaScript
    return this.executePython(config); // Simplified for now
  }

  private async executeCpp(config: RunnerConfig): Promise<RunnerResult> {
    // Similar implementation for C++
    return this.executePython(config); // Simplified for now
  }

  private async executeJava(config: RunnerConfig): Promise<RunnerResult> {
    // Similar implementation for Java
    return this.executePython(config); // Simplified for now
  }

  private async runPythonTestCase(code: string, testCase: any, timeLimit: number): Promise<any> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Create a temporary Python file
      const fs = require('fs');
      const path = require('path');
      const tempDir = '/tmp';
      const fileName = `temp_${Date.now()}.py`;
      const filePath = path.join(tempDir, fileName);
      
      try {
        fs.writeFileSync(filePath, code);
        
        const python = spawn('python3', [filePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: timeLimit
        });

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
        });

        python.on('close', (code) => {
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          
          // Clean up
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          if (code !== 0) {
            resolve({
              caseId: testCase.id,
              status: SubmissionStatus.RUNTIME_ERROR,
              timeMs: executionTime,
              memoryKb: 0,
              errorMessage: error
            });
          } else {
            const isCorrect = output.trim() === testCase.expectedOutput.trim();
            resolve({
              caseId: testCase.id,
              status: isCorrect ? 'OK' : SubmissionStatus.WRONG_ANSWER,
              timeMs: executionTime,
              memoryKb: 0,
              actualOutput: output.trim(),
              expectedOutput: testCase.expectedOutput.trim()
            });
          }
        });

        python.on('error', (err) => {
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          
          resolve({
            caseId: testCase.id,
            status: SubmissionStatus.RUNTIME_ERROR,
            timeMs: executionTime,
            memoryKb: 0,
            errorMessage: err.message
          });
        });

        // Send input to the program
        python.stdin.write(testCase.input);
        python.stdin.end();

      } catch (error) {
        resolve({
          caseId: testCase.id,
          status: SubmissionStatus.RUNTIME_ERROR,
          timeMs: 0,
          memoryKb: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
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
    // This would be implemented with actual metrics
    return {
      activeRunners: 0,
      totalExecutions: 0,
      averageExecutionTime: 0
    };
  }
}

