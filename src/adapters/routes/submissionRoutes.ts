import { Router } from 'express';
import { SubmissionController } from '../controllers/SubmissionController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware, SubmissionSchemas, CommonSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';

export function createSubmissionRoutes(
  submissionController: SubmissionController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/submissions:
   *   post:
   *     summary: Submit a solution
   *     tags: [Submissions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - challengeId
   *               - courseId
   *               - language
   *               - code
   *             properties:
   *               challengeId:
   *                 type: string
   *               courseId:
   *                 type: string
   *               language:
   *                 type: string
   *                 enum: [python, javascript, cpp, java]
   *               code:
   *                 type: string
   *                 example: "def solution():\n    return True"
   *     responses:
   *       201:
   *         description: Solution submitted successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/',
    ValidationMiddleware.validate(SubmissionSchemas.create),
    ErrorHandler.asyncHandler(submissionController.submitSolution.bind(submissionController))
  );

  /**
   * @swagger
   * /api/submissions:
   *   get:
   *     summary: List all submissions
   *     tags: [Submissions]
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
   *     responses:
   *       200:
   *         description: List of submissions
   */
  router.get(
    '/',
    ValidationMiddleware.validateQuery(CommonSchemas.submissionList),
    ErrorHandler.asyncHandler(submissionController.getSubmissions.bind(submissionController))
  );

  /**
   * @swagger
   * /api/submissions/my:
   *   get:
   *     summary: Get current user's submissions
   *     tags: [Submissions]
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
   *     responses:
   *       200:
   *         description: User's submissions
   */
  router.get(
    '/my',
    ValidationMiddleware.validateQuery(CommonSchemas.pagination),
    ErrorHandler.asyncHandler(submissionController.getMySubmissions.bind(submissionController))
  );

  /**
   * @swagger
   * /api/submissions/stats:
   *   get:
   *     summary: Get submission statistics
   *     tags: [Submissions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Submission statistics
   */
  router.get(
    '/stats',
    ErrorHandler.asyncHandler(submissionController.getSubmissionStats.bind(submissionController))
  );

  /**
   * @swagger
   * /api/submissions/{id}:
   *   get:
   *     summary: Get submission by ID
   *     tags: [Submissions]
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
   *         description: Submission details
   *       404:
   *         description: Submission not found
   */
  router.get(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(submissionController.getSubmissionById.bind(submissionController))
  );

  return router;
}

