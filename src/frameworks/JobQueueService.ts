import Queue from 'bull';
import { IJobQueueService, JobData } from '../domain/services/IJobQueueService';
import { SubmissionResult, SubmissionStatus } from '../domain/entities/Submission';

export class JobQueueService implements IJobQueueService {
  private submissionQueue: Queue.Queue;

  constructor() {
    this.submissionQueue = new Queue('submission processing', process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.setupQueue();
  }

  private setupQueue(): void {
    // Process jobs
    this.submissionQueue.process('process-submission', async (job) => {
      const jobData = job.data as JobData;
      return await this.processSubmissionJob(jobData);
    });

    // Handle completed jobs
    this.submissionQueue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed with result:`, result);
    });

    // Handle failed jobs
    this.submissionQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });
  }

  async addSubmissionJob(jobData: JobData): Promise<void> {
    await this.submissionQueue.add('process-submission', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });
  }

  async processSubmissionJob(jobData: JobData): Promise<SubmissionResult> {
    // This will be implemented by the worker
    // For now, return a mock result
    return {
      submissionId: jobData.submissionId,
      status: SubmissionStatus.ACCEPTED,
      score: 100,
      timeMsTotal: 500,
      memoryKbTotal: 1024,
      testCaseResults: []
    };
  }

  async getJobStatus(jobId: string): Promise<string> {
    const job = await this.submissionQueue.getJob(jobId);
    if (!job) {
      return 'NOT_FOUND';
    }
    return await job.getState();
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.submissionQueue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const waiting = await this.submissionQueue.getWaiting();
    const active = await this.submissionQueue.getActive();
    const completed = await this.submissionQueue.getCompleted();
    const failed = await this.submissionQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }
}

