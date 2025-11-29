// src/frameworks/JobQueueService.ts

import Queue from 'bull';
import { Logger } from './Logger';
import {
  SUBMISSION_QUEUE_NAME,
  PROCESS_SUBMISSION_JOB,
} from '../config/queues';

export interface ProcessSubmissionJobData {
  submissionId: string;
  userId: string;
  challengeId: string;
  language: string;
}

export class JobQueueService {
  private queue: Queue.Queue;
  private logger: Logger;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.logger = new Logger('JobQueueService');
    this.queue = new Queue(SUBMISSION_QUEUE_NAME, redisUrl);

    this.logger.info('JobQueueService initialized', {
      queueName: SUBMISSION_QUEUE_NAME,
      redisUrl,
    });
  }

  /**
   * Encola un submission para ser procesado por el worker.
   */
  async enqueueSubmission(data: ProcessSubmissionJobData) {
    this.logger.info('Enqueuing submission job', {
      submissionId: data.submissionId,
      userId: data.userId,
      challengeId: data.challengeId,
      language: data.language,
    });

    const job = await this.queue.add(PROCESS_SUBMISSION_JOB, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.info('Submission job enqueued', {
      jobId: job.id,
      submissionId: data.submissionId,
    });

    return job;
  }
}
