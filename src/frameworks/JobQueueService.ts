import Queue, { JobOptions } from 'bull';
import { Logger } from './Logger';

export interface SubmissionJobPayload {
  submissionId: string;
  userId: string;
  challengeId: string;
  language: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export class JobQueueService {
  private queue: Queue.Queue<SubmissionJobPayload>;
  private logger: Logger;

  constructor(
    queueName = 'submission processing',
    redisUrl?: string,
    logger?: Logger,
    queueOptions: Queue.QueueOptions = {},
    defaultJobOptions: JobOptions = {},
  ) {
    const effectiveQueueName = queueName ?? 'submission processing';
    const effectiveRedisUrl =
      redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';

    this.logger = logger ?? new Logger('JobQueueService');

    this.queue = new Queue<SubmissionJobPayload>(
      effectiveQueueName,
      effectiveRedisUrl,
      queueOptions,
    );

    // Opciones por defecto para TODOS los jobs
    (this.queue as any).defaultJobOptions = {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      ...defaultJobOptions,
    };

    this.setupEventLogging();
  }

  // Se usa en SubmitSolutionUseCase
  public async enqueueSubmission(
    payload: SubmissionJobPayload,
  ): Promise<void> {
    await this.queue.add('process-submission', payload);
    this.logger.info('Submission enqueued for processing', payload);
  }

  // Si en algún sitio necesitas la Queue cruda (por ejemplo en los workers)
  public getQueue(): Queue.Queue<SubmissionJobPayload> {
    return this.queue;
  }

  // Para /api/metrics (stats de la cola)
  public async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  public async isConnected(): Promise<boolean> {
    try {
      await (this.queue as any).client.ping();
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.queue.close();
  }

  private setupEventLogging() {
    this.queue.on('completed', (job) => {
      this.logger.info('Job completed', { jobId: job.id });
    });

    this.queue.on('failed', (job, err) => {
      this.logger.error('Job failed', {
        jobId: job?.id,
        error: err?.message,
      });
    });

    this.queue.on('stalled', (job) => {
      this.logger.warn('Job stalled', { jobId: job.id });
    });
  }
}
