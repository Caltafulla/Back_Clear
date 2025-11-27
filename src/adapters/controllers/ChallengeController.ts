import { Request, Response } from 'express';
import { CreateChallengeUseCase } from '../../application/use-cases/challenges/CreateChallengeUseCase';
import { IChallengeRepository } from '../../domain/repositories/IChallengeRepository';
import { ChallengeDifficulty, ChallengeStatus } from '../../domain/entities/Challenge';

export class ChallengeController {
  constructor(
    private createChallengeUseCase: CreateChallengeUseCase,
    private challengeRepository: IChallengeRepository
  ) {}

  async createChallenge(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const challenge = await this.createChallengeUseCase.execute(req.body, userId, userRole);

      res.status(201).json({
        success: true,
        data: challenge
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create challenge'
      });
    }
  }

  async getChallenges(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, status, difficulty, tags, limit = 50, offset = 0 } = req.query;
      const requesterRole = (req as any).user?.role as string | undefined;

      let challenges;

      if (courseId) {
        challenges = await this.challengeRepository.findByCourseId(courseId as string);
      } else if (status) {
        challenges = await this.challengeRepository.findByStatus(status as ChallengeStatus);
      } else if (difficulty) {
        challenges = await this.challengeRepository.findByDifficulty(difficulty as string);
      } else if (tags) {
        const tagArray = Array.isArray(tags) ? tags as string[] : [tags as string];
        challenges = await this.challengeRepository.findByTags(tagArray);
      } else {
        challenges = await this.challengeRepository.findAll(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      // If requester is STUDENT, only expose published challenges and hide hidden test cases
      if (requesterRole === 'STUDENT') {
        const published = (challenges || []).filter((c: any) => c.status === ChallengeStatus.PUBLISHED);
        const sanitized = published.map((c: any) => ({
          ...c,
          testCases: Array.isArray(c.testCases) ? c.testCases.filter((tc: any) => !tc.isHidden) : []
        }));
        res.status(200).json({ success: true, data: sanitized });
        return;
      }

      res.status(200).json({ success: true, data: challenges });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch challenges'
      });
    }
  }

  async getChallengeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const requesterRole = (req as any).user?.role as string | undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Challenge ID is required'
        });
        return;
      }
      const challenge = await this.challengeRepository.findById(id);

      if (!challenge) {
        res.status(404).json({
          success: false,
          message: 'Challenge not found'
        });
        return;
      }

      // Students can only access published challenges and must not see hidden test cases
      if (requesterRole === 'STUDENT') {
        if (challenge.status !== ChallengeStatus.PUBLISHED) {
          res.status(403).json({ success: false, message: 'Challenge not available' });
          return;
        }
        const sanitized = {
          ...challenge,
          testCases: Array.isArray(challenge.testCases) ? challenge.testCases.filter(tc => !tc.isHidden) : []
        };
        res.status(200).json({ success: true, data: sanitized });
        return;
      }

      res.status(200).json({ success: true, data: challenge });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch challenge'
      });
    }
  }

  async updateChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Challenge ID is required'
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

      const challenge = await this.challengeRepository.update(id, req.body);

      if (!challenge) {
        res.status(404).json({
          success: false,
          message: 'Challenge not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: challenge
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update challenge'
      });
    }
  }

  async deleteChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Challenge ID is required'
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

      const deleted = await this.challengeRepository.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Challenge not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Challenge deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete challenge'
      });
    }
  }

  async searchChallenges(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const challenges = await this.challengeRepository.search(q as string);

      res.status(200).json({
        success: true,
        data: challenges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to search challenges'
      });
    }
  }
}

