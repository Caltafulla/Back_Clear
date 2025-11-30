// src/domain/services/IRunnerService.ts
import {
  ProgrammingLanguage,
  SubmissionStatus,
  TestCaseResult,
} from '../entities/Submission';

export interface RunnerConfig {
  language: ProgrammingLanguage;
  code: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
  }>;
  timeLimit: number;
  memoryLimit: number;
}

export interface RunnerResult {
  status: SubmissionStatus;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: TestCaseResult[];
  errorMessage?: string;
}

export interface IRunnerService {
  // 👈 ESTE es el método que debe implementar RunnerService
  execute(config: RunnerConfig): Promise<RunnerResult>;
}
