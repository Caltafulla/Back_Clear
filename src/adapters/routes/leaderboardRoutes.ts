import { Router } from 'express';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware, CommonSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';

export function createLeaderboardRoutes(
  leaderboardController: LeaderboardController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public endpoints (competition mode)
  router.get(
    '/public/challenge/:id',
    authMiddleware.optionalAuth,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getChallengeLeaderboard.bind(leaderboardController))
  );

  router.get(
    '/public/course/:id',
    authMiddleware.optionalAuth,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getCourseLeaderboard.bind(leaderboardController))
  );

  router.get(
    '/public/evaluation/:id',
    authMiddleware.optionalAuth,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getEvaluationLeaderboard.bind(leaderboardController))
  );

  /**
   * @swagger
   * /api/leaderboard/challenge/{id}:
   *   get:
   *     summary: Get challenge leaderboard
   *     tags: [Leaderboard]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Challenge leaderboard
   */
  router.get(
    '/challenge/:id',
    authMiddleware.authenticate,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getChallengeLeaderboard.bind(leaderboardController))
  );

  /**
   * @swagger
   * /api/leaderboard/course/{id}:
   *   get:
   *     summary: Get course leaderboard
   *     tags: [Leaderboard]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Course leaderboard
   */
  router.get(
    '/course/:id',
    authMiddleware.authenticate,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getCourseLeaderboard.bind(leaderboardController))
  );

  /**
   * @swagger
   * /api/leaderboard/evaluation/{id}:
   *   get:
   *     summary: Get evaluation leaderboard
   *     tags: [Leaderboard]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Evaluation leaderboard
   */
  router.get(
    '/evaluation/:id',
    authMiddleware.authenticate,
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(leaderboardController.getEvaluationLeaderboard.bind(leaderboardController))
  );

  return router;
}

