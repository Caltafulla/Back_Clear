import { Request, Response } from 'express';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { CreateEvaluationUseCase } from '../../application/use-cases/evaluations/CreateEvaluationUseCase';

export class EvaluationController {
  constructor(
    private createEvaluationUseCase: CreateEvaluationUseCase,
    private evaluationRepository: IEvaluationRepository
  ) {}

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
   *                 example: "Primer examen parcial del curso"
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
  async createEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const evaluation = await this.createEvaluationUseCase.execute(req.body, userId);

      res.status(201).json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create evaluation'
      });
    }
  }

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
  async getEvaluations(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, status, limit = 50, offset = 0 } = req.query;

      let evaluations;

      if (courseId) {
        evaluations = await this.evaluationRepository.findByCourseId(courseId as string);
      } else if (status) {
        evaluations = await this.evaluationRepository.findByStatus(status as any);
      } else {
        evaluations = await this.evaluationRepository.findAll(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      res.status(200).json({
        success: true,
        data: evaluations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch evaluations'
      });
    }
  }

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
  async getEvaluationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Evaluation ID is required'
        });
        return;
      }
      const evaluation = await this.evaluationRepository.findById(id);

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch evaluation'
      });
    }
  }

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
   *             properties:
   *               name:
   *                 type: string
   *               description:
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
   *               maxAttempts:
   *                 type: number
   *               status:
   *                 type: string
   *                 enum: [draft, scheduled, active, finished, cancelled]
   *     responses:
   *       200:
   *         description: Evaluation updated successfully
   *       404:
   *         description: Evaluation not found
   */
  async updateEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Evaluation ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const evaluation = await this.evaluationRepository.update(id, req.body);

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update evaluation'
      });
    }
  }

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
  async deleteEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Evaluation ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const deleted = await this.evaluationRepository.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete evaluation'
      });
    }
  }
}

