import { Router } from 'express';
import { ChallengeController } from '../controllers/ChallengeController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware, ChallengeSchemas, CommonSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';
import { UserRole } from '../../domain/entities/User';

export function createChallengeRoutes(
  challengeController: ChallengeController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/challenges:
   *   post:
   *     summary: Create a new challenge
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - description
   *               - difficulty
   *               - tags
   *               - timeLimit
   *               - memoryLimit
   *               - courseId
   *               - testCases
   *             properties:
   *               title:
   *                 type: string
   *                 example: "Two Sum"
   *               description:
   *                 type: string
   *                 example: "Find two numbers that add up to target"
   *               difficulty:
   *                 type: string
   *                 enum: [Easy, Medium, Hard]
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["arrays", "hashmap"]
   *               timeLimit:
   *                 type: number
   *                 example: 1000
   *               memoryLimit:
   *                 type: number
   *                 example: 256
   *               courseId:
   *                 type: string
   *               testCases:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       201:
   *         description: Challenge created successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/',
    ValidationMiddleware.validate(ChallengeSchemas.create),
    ErrorHandler.asyncHandler(challengeController.createChallenge.bind(challengeController))
  );

  /**
   * @swagger
   * /api/challenges:
   *   get:
   *     summary: List all challenges
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *       - in: query
   *         name: courseId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, archived]
   *       - in: query
   *         name: difficulty
   *         schema:
   *           type: string
   *           enum: [Easy, Medium, Hard]
   *     responses:
   *       200:
   *         description: List of challenges
   */
  router.get(
    '/',
    ValidationMiddleware.validateQuery(CommonSchemas.challengeList),
    ErrorHandler.asyncHandler(challengeController.getChallenges.bind(challengeController))
  );

  /**
   * @swagger
   * /api/challenges/search:
   *   get:
   *     summary: Search challenges
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         example: "two sum"
   *     responses:
   *       200:
   *         description: Search results
   */
  router.get(
    '/search',
    ErrorHandler.asyncHandler(challengeController.searchChallenges.bind(challengeController))
  );

  /**
   * @swagger
   * /api/challenges/{id}:
   *   get:
   *     summary: Get challenge by ID
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Challenge details
   *       404:
   *         description: Challenge not found
   */
  router.get(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(challengeController.getChallengeById.bind(challengeController))
  );

  /**
   * @swagger
   * /api/challenges/{id}:
   *   put:
   *     summary: Update challenge
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Challenge updated successfully
   *       404:
   *         description: Challenge not found
   */
  router.put(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ValidationMiddleware.validate(ChallengeSchemas.update),
    ErrorHandler.asyncHandler(challengeController.updateChallenge.bind(challengeController))
  );

  /**
   * @swagger
   * /api/challenges/{id}:
   *   delete:
   *     summary: Delete challenge
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Challenge deleted successfully
   *       404:
   *         description: Challenge not found
   */
  router.delete(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    authMiddleware.authorize(UserRole.ADMIN, UserRole.PROFESSOR),
    ErrorHandler.asyncHandler(challengeController.deleteChallenge.bind(challengeController))
  );

  return router;
}

