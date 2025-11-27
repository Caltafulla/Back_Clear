import Queue from 'bull';
import mongoose from 'mongoose';
import { ProcessSubmissionUseCase } from '../application/use-cases/submissions/ProcessSubmissionUseCase';
import { ISubmissionRepository } from '../domain/repositories/ISubmissionRepository';
import { IRunnerService } from '../domain/services/IRunnerService';
import { ILeaderboardRepository } from '../domain/repositories/ILeaderboardRepository';
import { Logger } from '../frameworks/Logger';

// Concrete implementations to run inside the worker
import { MockSubmissionRepository } from '../adapters/repositories/MockSubmissionRepository';
import { MongoSubmissionRepository } from '../adapters/repositories/MongoSubmissionRepository';
import { RunnerService } from '../frameworks/RunnerService';
import { ComputedLeaderboardRepository } from '../adapters/repositories/ComputedLeaderboardRepository';
import { MongoUserRepository } from '../adapters/repositories/MongoUserRepository';
import { MockEvaluationRepository } from '../adapters/repositories/MockEvaluationRepository';
import { MongoChallengeRepository } from '../adapters/repositories/MongoChallengeRepository';

class Worker {
  private submissionQueue: Queue.Queue;
  private logger: Logger;
  private processSubmissionUseCase: ProcessSubmissionUseCase;

  constructor() {
    this.logger = new Logger('Worker');
    this.submissionQueue = new Queue('submission processing', process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Initialize concrete dependencies used by the worker
    const submissionRepository = new MongoSubmissionRepository();
    const runnerService = new RunnerService();
    const userRepo = new MongoUserRepository();
    const evaluationRepo = new MockEvaluationRepository();
    const leaderboardRepository = new ComputedLeaderboardRepository(submissionRepository, userRepo, evaluationRepo) as ILeaderboardRepository;
    const challengeRepository = new MongoChallengeRepository();

    this.processSubmissionUseCase = new ProcessSubmissionUseCase(
      submissionRepository,
      runnerService,
      leaderboardRepository,
      challengeRepository
    );

    this.setupQueue();
  }

  private setupQueue(): void {
    // Process jobs
    this.submissionQueue.process('process-submission', async (job) => {
      const jobData = job.data;
      
      this.logger.info('Processing submission job', {
        jobId: job.id,
        submissionId: jobData.submissionId,
        userId: jobData.userId,
        challengeId: jobData.challengeId,
        language: jobData.language
      });

      try {
        const result = await this.processSubmissionUseCase.execute(jobData.submissionId);
        
        this.logger.info('Submission processed successfully', {
          jobId: job.id,
          submissionId: jobData.submissionId,
          status: result.status,
          score: result.score
        });

        return result;
      } catch (error) {
        this.logger.error('Failed to process submission', {
          jobId: job.id,
          submissionId: jobData.submissionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    });

    // Handle completed jobs
    this.submissionQueue.on('completed', (job, result) => {
      this.logger.info('Job completed', {
        jobId: job.id,
        submissionId: job.data.submissionId,
        result
      });
    });

    // Handle failed jobs
    this.submissionQueue.on('failed', (job, err) => {
      this.logger.error('Job failed', {
        jobId: job.id,
        submissionId: job.data.submissionId,
        error: err.message,
        stack: err.stack
      });
    });

    // Handle stalled jobs
    this.submissionQueue.on('stalled', (job) => {
      this.logger.warn('Job stalled', {
        jobId: job.id,
        submissionId: job.data.submissionId
      });
    });

    this.logger.info('Worker started and listening for jobs');
  }

  public async start(): Promise<void> {
    this.logger.info('Starting worker...');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully...');
      this.submissionQueue.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, shutting down gracefully...');
      this.submissionQueue.close();
      process.exit(0);
    });
  }
}

// Connect to MongoDB then start worker
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/algorithmic-challenges';

mongoose.connect(DATABASE_URL)
  .then(() => {
    const worker = new Worker();
    worker.start().catch((error) => {
      console.error('Failed to start worker:', error);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Worker failed to connect to MongoDB', err);
    process.exit(1);
  });

