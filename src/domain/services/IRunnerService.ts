import { ProgrammingLanguage, SubmissionResult } from '../entities/Submission';

export interface RunnerConfig {
  language: ProgrammingLanguage;
  code: string;
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export interface RunnerResult {
  status: string;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: Array<{
    caseId: string;
    status: string;
    timeMs: number;
    memoryKb: number;
    actualOutput?: string;
    expectedOutput?: string;
    errorMessage?: string;
  }>;
  errorMessage?: string;
}

export interface IRunnerService {
  executeCode(config: RunnerConfig): Promise<RunnerResult>;
  isLanguageSupported(language: ProgrammingLanguage): boolean;
  getSupportedLanguages(): ProgrammingLanguage[];
  getRunnerStats(): Promise<{
    activeRunners: number;
    totalExecutions: number;
    averageExecutionTime: number;
  }>;
}

