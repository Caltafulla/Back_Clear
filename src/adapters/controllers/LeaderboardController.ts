import { Request, Response } from 'express';
import { ILeaderboardRepository } from '../../domain/repositories/ILeaderboardRepository';

export class LeaderboardController {
  constructor(private leaderboardRepository: ILeaderboardRepository) {}

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
  async getChallengeLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Challenge ID is required'
        });
        return;
      }

      const leaderboard = await this.leaderboardRepository.getChallengeLeaderboard(
        id,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch challenge leaderboard'
      });
    }
  }

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
  async getCourseLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      const leaderboard = await this.leaderboardRepository.getCourseLeaderboard(
        id,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course leaderboard'
      });
    }
  }

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
  async getEvaluationLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Evaluation ID is required'
        });
        return;
      }

      const leaderboard = await this.leaderboardRepository.getEvaluationLeaderboard(
        id,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch evaluation leaderboard'
      });
    }
  }
}

