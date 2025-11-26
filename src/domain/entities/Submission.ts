export enum SubmissionStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR'
}

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  CPP = 'cpp',
  JAVA = 'java'
}

export interface TestCaseResult {
  caseId: string;
  status: SubmissionStatus;
  timeMs: number;
  memoryKb: number;
  actualOutput?: string;
  expectedOutput?: string;
  errorMessage?: string;
}

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  courseId: string;
  language: ProgrammingLanguage;
  code: string;
  status: SubmissionStatus;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: TestCaseResult[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubmissionRequest {
  challengeId: string;
  courseId: string;
  language: ProgrammingLanguage;
  code: string;
}

export interface CreateSubmissionWithUserRequest extends CreateSubmissionRequest {
  userId: string;
}

export interface SubmissionResult {
  submissionId: string;
  status: SubmissionStatus;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: TestCaseResult[];
  errorMessage?: string;
}

