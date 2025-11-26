import { Router } from 'express';
import { AIAssistantController } from '../controllers/AIAssistantController';
import { AuthMiddleware } from '../middleware/auth';
import { ErrorHandler } from '../middleware/errorHandler';

export function createAIAssistantRoutes(
  aiAssistantController: AIAssistantController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/ai/generate-challenges:
   *   post:
   *     summary: Generate challenge ideas using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - topic
   *             properties:
   *               topic:
   *                 type: string
   *                 example: "Dynamic Programming"
   *               count:
   *                 type: number
   *                 default: 3
   *                 minimum: 1
   *                 maximum: 10
   *     responses:
   *       200:
   *         description: Challenge ideas generated successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/generate-challenges',
    ErrorHandler.asyncHandler(aiAssistantController.generateChallenges.bind(aiAssistantController))
  );

  /**
   * @swagger
   * /api/ai/generate-test-cases:
   *   post:
   *     summary: Generate test cases for a challenge using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - challengeDescription
   *             properties:
   *               challengeDescription:
   *                 type: string
   *                 example: "Given an array of integers, find the maximum sum"
   *               count:
   *                 type: number
   *                 default: 5
   *                 minimum: 1
   *                 maximum: 20
   *     responses:
   *       200:
   *         description: Test cases generated successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/generate-test-cases',
    ErrorHandler.asyncHandler(aiAssistantController.generateTestCases.bind(aiAssistantController))
  );

  /**
   * @swagger
   * /api/ai/validate-test-case:
   *   post:
   *     summary: Validate a test case using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - input
   *               - expectedOutput
   *               - language
   *             properties:
   *               input:
   *                 type: string
   *                 example: "[1, 2, 3, 4, 5]"
   *               expectedOutput:
   *                 type: string
   *                 example: "15"
   *               language:
   *                 type: string
   *                 enum: [python, javascript, cpp, java]
   *                 example: "python"
   *     responses:
   *       200:
   *         description: Test case validation result
   *       400:
   *         description: Validation error
   */
  router.post(
    '/validate-test-case',
    ErrorHandler.asyncHandler(aiAssistantController.validateTestCase.bind(aiAssistantController))
  );

  return router;
}

