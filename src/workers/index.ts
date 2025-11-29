// src/workers/index.ts

import Queue from 'bull';
import mongoose from 'mongoose';
import { ProcessSubmissionUseCase } from '../application/use-cases/submissions/ProcessSubmissionUseCase';
import { ISubmissionRepository } from '../domain/repositories/ISubmissionRepository';
import { IRunnerService } from '../domain/services/IRunnerService';
import { ILeaderboardRepository } from '../domain/repositories/ILeaderboardRepository';
import { Logger } from '../frameworks/Logger';

// Concrete implementations to run inside the worker
import { MongoSubmissionRepository } from '../adapters/repositories/MongoSubmissionRepository';
import { RunnerService } from '../frameworks/RunnerService';
import { ComputedLeaderboardRepository } from '../adapters/repositories/ComputedLeaderboardRepository';
import { MongoUserRepository } from '../adapters/repositories/MongoUserRepository';
import { MockEvaluationRepository } from '../adapters/repositories/MockEvaluationRepository';
import { MongoChallengeRepository } from '../adapters/repositories/MongoChallengeRepository';

import {
  SUBMISSION_QUEUE_NAME,
  PROCESS_SUBMISSION_JOB,
  WORKER_CONCURRENCY,
} from '../config/queues';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/algorithmic-challenges';

// Tipado del payload del job para tener autocompletado
interface ProcessSubmissionJobData {
  submissionId: string;
  userId?: string;
  challengeId?: string;
  language?: string;
}

class Worker {
  private submissionQueue: Queue.Queue;
  private logger: Logger;
  private processSubmissionUseCase: ProcessSubmissionUseCase;
  private shuttingDown = false;

  constructor() {
    this.logger = new Logger('Worker');
    this.submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, REDIS_URL);

    // Inicializar dependencias concretas
    const submissionRepository: ISubmissionRepository =
      new MongoSubmissionRepository();
    const runnerService: IRunnerService = new RunnerService();
    const userRepo = new MongoUserRepository();
    const evaluationRepo = new MockEvaluationRepository(); // TODO: cambiar a repo real si lo necesitas
    const leaderboardRepository = new ComputedLeaderboardRepository(
      submissionRepository,
      userRepo,
      evaluationRepo,
    ) as ILeaderboardRepository;
    const challengeRepository = new MongoChallengeRepository();

    this.processSubmissionUseCase = new ProcessSubmissionUseCase(
      submissionRepository,
      runnerService,
      leaderboardRepository,
      challengeRepository,
    );

    this.setupQueue();
  }

  private setupQueue(): void {
    // Procesamiento concurrente de jobs
    this.submissionQueue.process(
      PROCESS_SUBMISSION_JOB,
      WORKER_CONCURRENCY,
      async (job) => {
        const jobData = job.data as ProcessSubmissionJobData;

        this.logger.info('Processing submission job', {
          jobId: job.id,
          submissionId: jobData.submissionId,
          userId: jobData.userId,
          challengeId: jobData.challengeId,
          language: jobData.language,
        });

        try {
          const result = await this.processSubmissionUseCase.execute(
            jobData.submissionId,
          );

          this.logger.info('Submission processed successfully', {
            jobId: job.id,
            submissionId: jobData.submissionId,
            status: result.status,
            score: result.score,
          });

          return result;
        } catch (error) {
          this.logger.error('Failed to process submission', {
            jobId: job.id,
            submissionId: jobData.submissionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Re-lanzamos el error para que Bull marque el job como failed
          throw error;
        }
      },
    );

    // Eventos de Bull para observabilidad
    this.submissionQueue.on('completed', (job, result) => {
      const jobData = job.data as ProcessSubmissionJobData;

      this.logger.info('Job completed', {
        jobId: job.id,
        submissionId: jobData.submissionId,
        result,
      });
    });

    this.submissionQueue.on('failed', (job, err) => {
      const jobData = job.data as ProcessSubmissionJobData;

      this.logger.error('Job failed', {
        jobId: job.id,
        submissionId: jobData.submissionId,
        error: err.message,
        stack: err.stack,
      });
    });

    this.submissionQueue.on('stalled', (job) => {
      const jobData = job.data as ProcessSubmissionJobData;

      this.logger.warn('Job stalled', {
        jobId: job.id,
        submissionId: jobData.submissionId,
      });
    });

    this.submissionQueue.on('error', (err) => {
      this.logger.error('Queue error', {
        error: err.message,
        stack: err.stack,
      });
    });

    this.logger.info('Worker started and listening for jobs', {
      queueName: SUBMISSION_QUEUE_NAME,
      redisUrl: REDIS_URL,
      concurrency: WORKER_CONCURRENCY,
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    this.logger.info('Received shutdown signal, closing worker...', { signal });

    try {
      await this.submissionQueue.close();
      await mongoose.connection.close();

      this.logger.info('Worker shut down gracefully');
    } catch (error) {
      this.logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      process.exit(0);
    }
  }

  public start(): void {
    this.logger.info('Starting worker...');

    process.on('SIGINT', () => {
      void this.shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
      void this.shutdown('SIGTERM');
    });
  }
}

// Bootstrap
mongoose
  .connect(DATABASE_URL)
  .then(() => {
    const logger = new Logger('WorkerBootstrap');
    logger.info('Connected to MongoDB', { DATABASE_URL });

    const worker = new Worker();
    worker.start();
  })
  .catch((err) => {
    console.error('Worker failed to connect to MongoDB', err);
    process.exit(1);
  });
