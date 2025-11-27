import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// Importar tus servicios, repositorios y rutas
import { Logger } from './frameworks/Logger';
import { createAuthRoutes } from './adapters/routes/authRoutes';
import { createChallengeRoutes } from './adapters/routes/challengeRoutes';
import { createSubmissionRoutes } from './adapters/routes/submissionRoutes';
import { createCourseRoutes } from './adapters/routes/courseRoutes';
import { createEvaluationRoutes } from './adapters/routes/evaluationRoutes';
import { createLeaderboardRoutes } from './adapters/routes/leaderboardRoutes';
import { createAIAssistantRoutes } from './adapters/routes/aiAssistantRoutes';
import { ErrorHandler } from './adapters/middleware/errorHandler';
import { AuthMiddleware } from './adapters/middleware/auth';
import { AuthService } from './frameworks/AuthService';
import { JobQueueService } from './frameworks/JobQueueService';
import { RunnerService } from './frameworks/RunnerService';
import { AIAssistantService } from './frameworks/AIAssistantService';
import { submissionEvents } from './frameworks/SubmissionEvents';
import { MongoUserRepository } from './adapters/repositories/MongoUserRepository';
import { MongoChallengeRepository } from './adapters/repositories/MongoChallengeRepository';
import { MockCourseRepository } from './adapters/repositories/MockCourseRepository';
import { MockSubmissionRepository } from './adapters/repositories/MockSubmissionRepository';
import { MongoSubmissionRepository } from './adapters/repositories/MongoSubmissionRepository';
import { MockLeaderboardRepository } from './adapters/repositories/MockLeaderboardRepository';
import { ComputedLeaderboardRepository } from './adapters/repositories/ComputedLeaderboardRepository';
import { MockEvaluationRepository } from './adapters/repositories/MockEvaluationRepository';
import { LoginUseCase } from './application/use-cases/auth/LoginUseCase';
import { RegisterUseCase } from './application/use-cases/auth/RegisterUseCase';
import { CreateChallengeUseCase } from './application/use-cases/challenges/CreateChallengeUseCase';
import { SubmitSolutionUseCase } from './application/use-cases/submissions/SubmitSolutionUseCase';
import { EvaluationService } from './frameworks/EvaluationService';
import { CreateCourseUseCase } from './application/use-cases/courses/CreateCourseUseCase';
import { CreateEvaluationUseCase } from './application/use-cases/evaluations/CreateEvaluationUseCase';
import { AuthController } from './adapters/controllers/AuthController';
import { ChallengeController } from './adapters/controllers/ChallengeController';
import { SubmissionController } from './adapters/controllers/SubmissionController';
import { CourseController } from './adapters/controllers/CourseController';
import { EvaluationController } from './adapters/controllers/EvaluationController';
import { LeaderboardController } from './adapters/controllers/LeaderboardController';
import { AIAssistantController } from './adapters/controllers/AIAssistantController';

const app = express();
const logger = new Logger('Application');

// 🧱 Middleware base
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Capturar errores de parseo JSON (body-parser) y devolver 400 en vez de 500
app.use((err: any, req: any, res: any, next: any) => {
  if (err && err.status === 400 && err.type === 'entity.parse.failed') {
    const loggerInstance = new Logger('Application');
    loggerInstance.error('Invalid JSON payload', { error: err.message, url: req.url, method: req.method });
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  return next(err);
});

// 📈 Rate limit y logs
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { success: false, message: 'Too many requests, try again later.' }
}));
app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.info(msg.trim()) }
}));

// 🧩 Instanciar dependencias
const authService = new AuthService();
const jobQueueService = new JobQueueService();
const runnerService = new RunnerService();
const aiAssistantService = new AIAssistantService();

const userRepo = new MongoUserRepository();
const challengeRepo = new MongoChallengeRepository();
const courseRepo = new MockCourseRepository();
const submissionRepo = new MongoSubmissionRepository();
const evaluationRepo = new MockEvaluationRepository();
const evaluationService = new EvaluationService(evaluationRepo, submissionRepo);
const leaderboardRepo = new ComputedLeaderboardRepository(submissionRepo, userRepo, evaluationRepo);

const loginUC = new LoginUseCase(userRepo, authService);
const registerUC = new RegisterUseCase(userRepo, authService);
const createChallengeUC = new CreateChallengeUseCase(challengeRepo, courseRepo);
const submitSolutionUC = new SubmitSolutionUseCase(submissionRepo, challengeRepo, courseRepo, evaluationService, jobQueueService);
const createCourseUC = new CreateCourseUseCase(courseRepo);
const createEvaluationUC = new CreateEvaluationUseCase(evaluationRepo, courseRepo);

const authController = new AuthController(loginUC, registerUC, authService);
const challengeController = new ChallengeController(createChallengeUC, challengeRepo);
const submissionController = new SubmissionController(submitSolutionUC, submissionRepo);
const courseController = new CourseController(createCourseUC, courseRepo);
const evaluationController = new EvaluationController(createEvaluationUC, evaluationRepo);
const leaderboardController = new LeaderboardController(leaderboardRepo);
const leaderboardService = new (require('./frameworks/LeaderboardService').LeaderboardService)(
  leaderboardRepo,
  challengeRepo,
  courseRepo,
  evaluationRepo
);
const aiAssistantController = new AIAssistantController(aiAssistantService);

// Subscribe to submission updates so leaderboards update automatically
submissionEvents.on('submission.updated', async (submission: any) => {
  try {
    await leaderboardService.updateChallengeLeaderboard(submission);
    await leaderboardService.updateCourseLeaderboardForSubmission(submission);
    await leaderboardService.updateEvaluationLeaderboardForSubmission(submission);
  } catch (err) {
    logger.error('Failed to update leaderboards after submission update', err as any);
  }
});

const authMiddleware = new AuthMiddleware(authService);

// ✅ Endpoints base
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 🚀 Montar rutas principales
app.use('/api/auth', createAuthRoutes(authController));
app.use('/api/challenges', createChallengeRoutes(challengeController, authMiddleware));
app.use('/api/submissions', createSubmissionRoutes(submissionController, authMiddleware));
app.use('/api/courses', createCourseRoutes(courseController, authMiddleware));
app.use('/api/evaluations', createEvaluationRoutes(evaluationController, authMiddleware));
app.use('/api/leaderboard', createLeaderboardRoutes(leaderboardController, authMiddleware));
app.use('/api/ai', createAIAssistantRoutes(aiAssistantController, authMiddleware));

// 📊 Endpoint de métricas (mock)
app.get('/api/metrics', async (req, res) => {
  try {
    // Helpers
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allRecentSubmissions = await submissionRepo.findRecentSubmissions(1000000, 0);

    const getSubmissionsByStatus = async () => {
      const result: any = {};
      const { SubmissionStatus } = require('./domain/entities/Submission');
      for (const key of Object.keys(SubmissionStatus)) {
        const val = (SubmissionStatus as any)[key];
        const subs = await submissionRepo.findByStatus(val as any);
        result[val] = subs.length;
      }
      return result;
    };

    const getSubmissionsByLanguage = async () => {
      const result: any = {};
      const { ProgrammingLanguage } = require('./domain/entities/Submission');
      for (const key of Object.keys(ProgrammingLanguage)) {
        const val = (ProgrammingLanguage as any)[key];
        const subs = await submissionRepo.findByLanguage(val as any);
        result[val] = subs.length;
      }
      return result;
    };

    const submissionsToday = allRecentSubmissions.filter(s => new Date(s.createdAt) >= startOfToday);

    const getMostPopularChallenges = async () => {
      const counts: Record<string, number> = {};
      for (const s of allRecentSubmissions) {
        counts[s.challengeId] = (counts[s.challengeId] || 0) + 1;
      }
      // sort by count desc and return top 5 challengeIds
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([challengeId, count]) => ({ challengeId, submissions: count }));
    };

    const getChallengesByDifficulty = async () => {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const result: any = {};
      for (const d of difficulties) {
        const list = await challengeRepo.findByDifficulty(d);
        result[d] = list.length;
      }
      return result;
    };

    const getUsersByRole = async () => {
      const roles = ['STUDENT', 'ADMIN', 'PROFESSOR'];
      const result: any = {};
      for (const r of roles) {
        const users = await userRepo.findByRole(r);
        result[r] = users.length;
      }
      return result;
    };

    const getActiveUsersToday = async () => {
      const unique = new Set<string>();
      for (const s of submissionsToday) unique.add(s.userId);
      return unique.size;
    };

    const getCompletedEvaluations = async () => {
      const { EvaluationStatus } = require('./domain/entities/Evaluation');
      const completed = await evaluationRepo.findByStatus(EvaluationStatus.FINISHED);
      return completed.length;
    };

    const getEvaluationParticipationRate = async () => {
      const allUsers = await userRepo.findAll(1000000, 0);
      const submissionsWithEval = allRecentSubmissions.filter(s => s.evaluationId);
      const uniqueUsers = new Set(submissionsWithEval.map(s => s.userId));
      return allUsers.length === 0 ? 0 : uniqueUsers.size / allUsers.length;
    };

    const getAverageExecutionTime = async () => {
      if (allRecentSubmissions.length === 0) return 0;
      const sum = allRecentSubmissions.reduce((acc, s) => acc + (s.timeMsTotal || 0), 0);
      return sum / allRecentSubmissions.length;
    };

    const queueStats = await jobQueueService.getQueueStats();

    const workerUtilization = (() => {
      const denom = queueStats.waiting + queueStats.active;
      if (denom === 0) return 0;
      return queueStats.active / denom;
    })();

    const redisConnected = await jobQueueService.isConnected();

    const dbConnections = {
      readyState: (mongoose.connection && (mongoose.connection as any).readyState) || 0
    };

    const submissionsStats = await submissionRepo.getSubmissionStats();

    res.json({
      success: true,
      data: {
        submissions: {
          total: allRecentSubmissions.length,
          by_status: await getSubmissionsByStatus(),
          today: submissionsToday.length,
          by_language: await getSubmissionsByLanguage(),
          success_rate: submissionsStats.total === 0 ? 0 : submissionsStats.accepted / submissionsStats.total
        },
        challenges: {
          total: (await challengeRepo.findAll(1000000, 0)).length,
          by_difficulty: await getChallengesByDifficulty(),
          most_popular: await getMostPopularChallenges()
        },
        users: {
          total: (await userRepo.findAll(1000000, 0)).length,
          by_role: await getUsersByRole(),
          active_today: await getActiveUsersToday()
        },
        evaluations: {
          active: (await evaluationRepo.findByStatus((require('./domain/entities/Evaluation').EvaluationStatus).ACTIVE)).length,
          completed: await getCompletedEvaluations(),
          participation_rate: await getEvaluationParticipationRate()
        },
        performance: {
          average_execution_time: await getAverageExecutionTime(),
          queue_wait_time: queueStats.waiting,
          worker_utilization: workerUtilization
        },
        system: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          redis_connected: redisConnected,
          db_connections: dbConnections
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to gather metrics', error: err instanceof Error ? err.message : String(err) });
  }
});

// 📘 Swagger Docs
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Algorithmic Challenges API',
      version: '1.0.0',
      description: 'Documentación interactiva de la API para la plataforma de retos algorítmicos',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
    tags: [
      { name: 'Authentication', description: 'Endpoints de autenticación' },
      { name: 'Challenges', description: 'Gestión de retos algorítmicos' },
      { name: 'Submissions', description: 'Envío y gestión de soluciones' },
      { name: 'Courses', description: 'Gestión de cursos' },
      { name: 'Evaluations', description: 'Gestión de evaluaciones' },
      { name: 'Leaderboard', description: 'Tablas de clasificación' },
      { name: 'AI Assistant', description: 'Asistente IA para generar contenido' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'adapters/routes/*.js'),
    path.join(__dirname, 'adapters/controllers/*.js'),
  ],
};
const swaggerSpecs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Algorithmic Challenges API'
}));

// ⚠️ Manejo de errores
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// 🔌 Conexión a Mongo y arranque
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/algorithmic-challenges';

mongoose.connect(DATABASE_URL)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB', err);
    process.exit(1);
  });

export default app;
