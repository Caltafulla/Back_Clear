import { CreateSubmissionRequest, SubmissionResult } from '../entities/Submission';

export interface JobData {
  submissionId: string;
  userId: string;
  challengeId: string;
  courseId: string;
  language: string;
  code: string;
  timeLimit: number;
  memoryLimit: number;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export interface IJobQueueService {
  addSubmissionJob(jobData: JobData): Promise<void>;
  processSubmissionJob(jobData: JobData): Promise<SubmissionResult>;
  getJobStatus(jobId: string): Promise<string>;
  retryFailedJob(jobId: string): Promise<void>;
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}

