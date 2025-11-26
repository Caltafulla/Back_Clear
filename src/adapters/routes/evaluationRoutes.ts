import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware, EvaluationSchemas, CommonSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';
import { UserRole } from '../../domain/entities/User';

export function createEvaluationRoutes(
  evaluationController: EvaluationController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/evaluations:
   *   post:
   *     summary: Create a new evaluation
   *     tags: [Evaluations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - courseId
   *               - challengeIds
   *               - startDate
   *               - endDate
   *               - durationMinutes
   *               - maxAttempts
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Examen Parcial 1"
   *               description:
   *                 type: string
   *               courseId:
   *                 type: string
   *               challengeIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *               durationMinutes:
   *                 type: number
   *                 example: 120
   *               maxAttempts:
   *                 type: number
   *                 example: 3
   *     responses:
   *       201:
   *         description: Evaluation created successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/',
    authMiddleware.authorize(UserRole.PROFESSOR, UserRole.ADMIN),
    ValidationMiddleware.validate(EvaluationSchemas.create),
    ErrorHandler.asyncHandler(evaluationController.createEvaluation.bind(evaluationController))
  );

  /**
   * @swagger
   * /api/evaluations:
   *   get:
   *     summary: List all evaluations
   *     tags: [Evaluations]
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
   *           enum: [draft, scheduled, active, finished, cancelled]
   *     responses:
   *       200:
   *         description: List of evaluations
   */
  router.get(
    '/',
    ValidationMiddleware.validateQuery(CommonSchemas.pagination),
    ErrorHandler.asyncHandler(evaluationController.getEvaluations.bind(evaluationController))
  );

  /**
   * @swagger
   * /api/evaluations/{id}:
   *   get:
   *     summary: Get evaluation by ID
   *     tags: [Evaluations]
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
   *         description: Evaluation details
   *       404:
   *         description: Evaluation not found
   */
  router.get(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(evaluationController.getEvaluationById.bind(evaluationController))
  );

  /**
   * @swagger
   * /api/evaluations/{id}:
   *   put:
   *     summary: Update evaluation
   *     tags: [Evaluations]
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
   *         description: Evaluation updated successfully
   *       404:
   *         description: Evaluation not found
   */
  router.put(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ValidationMiddleware.validate(EvaluationSchemas.update),
    ErrorHandler.asyncHandler(evaluationController.updateEvaluation.bind(evaluationController))
  );

  /**
   * @swagger
   * /api/evaluations/{id}:
   *   delete:
   *     summary: Delete evaluation
   *     tags: [Evaluations]
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
   *         description: Evaluation deleted successfully
   *       404:
   *         description: Evaluation not found
   */
  router.delete(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    authMiddleware.authorize(UserRole.PROFESSOR, UserRole.ADMIN),
    ErrorHandler.asyncHandler(evaluationController.deleteEvaluation.bind(evaluationController))
  );

  return router;
}

