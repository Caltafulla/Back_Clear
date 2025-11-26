import { spawn } from 'child_process';
import { RunnerConfig, RunnerResult } from '../domain/services/IRunnerService';
import { SubmissionStatus } from '../domain/entities/Submission';

export class JavaRunner {
  async execute(config: RunnerConfig): Promise<RunnerResult> {
    const testCaseResults = [];
    let totalTime = 0;
    let totalMemory = 0;
    let passedTests = 0;

    for (const testCase of config.testCases) {
      const result = await this.runTestCase(config.code, testCase, config.timeLimit);
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

  private async runTestCase(code: string, testCase: any, timeLimit: number): Promise<any> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Create a temporary Java file
      const fs = require('fs');
      const path = require('path');
      const tempDir = '/tmp';
      const fileName = `Solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.java`;
      const className = `Solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filePath = path.join(tempDir, fileName);
      
      try {
        // Wrap the code with necessary imports and main method
        const wrappedCode = `
import java.util.Scanner;

public class ${className} {
    ${code}
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        System.out.println(main(input));
        scanner.close();
    }
}
`;
        
        fs.writeFileSync(filePath, wrappedCode);
        
        // Compile and run Java code in Docker container for isolation
        const docker = spawn('docker', [
          'run',
          '--rm',
          '--network', 'none',
          '--cpus', '0.5',
          '--memory', '512m',
          '--read-only',
          '--tmpfs', '/tmp:rw,size=100m',
          '--timeout', Math.ceil(timeLimit / 1000).toString(),
          'openjdk:11-jdk-alpine',
          'sh', '-c', `
            cd /tmp &&
            javac ${fileName} &&
            echo "${testCase.input}" | java ${className}
          `
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        docker.stdout.on('data', (data) => {
          output += data.toString();
        });

        docker.stderr.on('data', (data) => {
          error += data.toString();
        });

        docker.on('close', (code) => {
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          
          // Clean up
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            // Clean up compiled .class files
            const classFile = filePath.replace('.java', '.class');
            if (fs.existsSync(classFile)) {
              fs.unlinkSync(classFile);
            }
          } catch (e) {
            // Ignore cleanup errors
          }

          if (code !== 0) {
            // Check if it's a compilation error
            if (error.includes('error:') || error.includes('Error:') || error.includes('compilation failed')) {
              resolve({
                caseId: testCase.id,
                status: SubmissionStatus.COMPILATION_ERROR,
                timeMs: executionTime,
                memoryKb: 0,
                errorMessage: error
              });
            } else {
              resolve({
                caseId: testCase.id,
                status: SubmissionStatus.RUNTIME_ERROR,
                timeMs: executionTime,
                memoryKb: 0,
                errorMessage: error || 'Process exited with non-zero code'
              });
            }
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

        docker.on('error', (err) => {
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

        // Timeout handling
        setTimeout(() => {
          docker.kill('SIGKILL');
          resolve({
            caseId: testCase.id,
            status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
            timeMs: timeLimit,
            memoryKb: 0,
            errorMessage: 'Time limit exceeded'
          });
        }, timeLimit);

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
}

