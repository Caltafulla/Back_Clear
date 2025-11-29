// src/workers/index.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import Queue from 'bull';

import { ProcessSubmissionUseCase } from '../application/use-cases/submissions/ProcessSubmissionUseCase';

import { MongoSubmissionRepository } from '../adapters/repositories/MongoSubmissionRepository';
import { MongoChallengeRepository } from '../adapters/repositories/MongoChallengeRepository';
import { MockCourseRepository } from '../adapters/repositories/MockCourseRepository';
import { MockEvaluationRepository } from '../adapters/repositories/MockEvaluationRepository';
import { MongoUserRepository } from '../adapters/repositories/MongoUserRepository';
import { ComputedLeaderboardRepository } from '../adapters/repositories/ComputedLeaderboardRepository';

import { RunnerService } from '../frameworks/RunnerService';
import { Logger } from '../frameworks/Logger';

const logger = new Logger('WorkerMain');

const QUEUE_NAME = process.env.SUBMISSION_QUEUE_NAME || 'submission-processing';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mongodb://admin:password123@mongodb:27017/algorithmic-challenges?authSource=admin';

// ===== Repositorios y servicios =====
const submissionRepo = new MongoSubmissionRepository();
const challengeRepo = new MongoChallengeRepository();   // IChallengeRepository
const courseRepo = new MockCourseRepository();          // (por ahora no usado)
const evaluationRepo = new MockEvaluationRepository();
const userRepo = new MongoUserRepository();

// LeaderboardRepo que IMPLEMENTA ILeaderboardRepository
const leaderboardRepo = new ComputedLeaderboardRepository(
  submissionRepo,
  userRepo,
  evaluationRepo
);

const runnerService = new RunnerService();

// constructor de ProcessSubmissionUseCase:
// (submissionRepo, runnerService, leaderboardRepo, challengeRepo)
const processSubmissionUseCase = new ProcessSubmissionUseCase(
  submissionRepo,
  runnerService,
  leaderboardRepo,
  challengeRepo,
);

async function startWorker() {
  try {
    // 1) Conexión a Mongo
    await mongoose.connect(DATABASE_URL);
    logger.info('Worker conectado a MongoDB');

    // 2) Conexión a la cola Bull
    const queue = new Queue(QUEUE_NAME, REDIS_URL);

    // 3) Procesador de jobs
    queue.process('process-submission', async (job, done) => {
      try {
        logger.info('Worker procesando submission', {
          jobId: job.id,
          data: job.data,
        });

        // El payload del job tiene { submissionId }
        await processSubmissionUseCase.execute(job.data.submissionId);

        logger.info('Worker terminó submission', { jobId: job.id });
        done();
      } catch (err) {
        logger.error('Worker falló procesando submission', {
          jobId: job.id,
          error: err instanceof Error ? err.message : String(err),
        });
        done(err as any);
      }
    });

    // 4) Logs de eventos de la cola
    queue.on('completed', (job) => {
      logger.info('Job completado', { jobId: job.id });
    });

    queue.on('failed', (job, err) => {
      logger.error('Job fallido', {
        jobId: job.id,
        error: err.message,
      });
    });

    queue.on('error', (err) => {
      logger.error('Error en la cola', { error: err.message });
    });

    logger.info(
      `Worker escuchando la cola "${QUEUE_NAME}" usando Redis en ${REDIS_URL}`,
    );
  } catch (err) {
    logger.error('Error inicializando worker', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

startWorker().catch((err) => {
  logger.error('Unhandled error en worker', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
