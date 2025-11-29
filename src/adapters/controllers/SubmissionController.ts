import { Request, Response } from 'express';
import { SubmitSolutionUseCase } from '../../application/use-cases/submissions/SubmitSolutionUseCase';
import { ISubmissionRepository } from '../../domain/repositories/ISubmissionRepository';
import { SubmissionStatus, ProgrammingLanguage } from '../../domain/entities/Submission';

export class SubmissionController {
  constructor(
    private submitSolutionUseCase: SubmitSolutionUseCase,
    private submissionRepository: ISubmissionRepository
  ) {}

  async submitSolution(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { challengeId, courseId, language, code, evaluationId } = req.body;

      // Aquí armamos el input que espera el use case
      const submission = await this.submitSolutionUseCase.execute({
        userId,
        challengeId,
        courseId,
        language: language as ProgrammingLanguage,
        code,
        evaluationId,
      });

      res.status(201).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit solution',
      });
    }
  }

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId, challengeId, courseId, status, language, limit = 50, offset = 0 } = req.query;
      const currentUserId = (req as any).user?.userId;

      let submissions;

      if (userId && userId === currentUserId) {
        submissions = await this.submissionRepository.findByUserId(userId as string);
      } else if (challengeId) {
        submissions = await this.submissionRepository.findByChallengeId(challengeId as string);
      } else if (courseId) {
        submissions = await this.submissionRepository.findByCourseId(courseId as string);
      } else if (status) {
        submissions = await this.submissionRepository.findByStatus(status as SubmissionStatus);
      } else if (language) {
        submissions = await this.submissionRepository.findByLanguage(language as ProgrammingLanguage);
      } else {
        submissions = await this.submissionRepository.findRecentSubmissions(
          parseInt(limit as string, 10),
          parseInt(offset as string, 10)
        );
      }

      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
      });
    }
  }

  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Submission ID is required',
        });
        return;
      }
      const submission = await this.submissionRepository.findById(id);

      if (!submission) {
        res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submission',
      });
    }
  }

  async getMySubmissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { challengeId, limit = 50, offset = 0 } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      let submissions = await this.submissionRepository.findByUserId(userId);

      if (challengeId) {
        submissions = submissions.filter((s) => s.challengeId === challengeId);
      }

      const startIndex = parseInt(offset as string, 10);
      const endIndex = startIndex + parseInt(limit as string, 10);
      const paginatedSubmissions = submissions.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedSubmissions,
        pagination: {
          total: submissions.length,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user submissions',
      });
    }
  }

  async getSubmissionStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId, challengeId } = req.query;
      const currentUserId = (req as any).user?.userId;

      const targetUserId = (userId as string) || currentUserId;

      if (!targetUserId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const stats = await this.submissionRepository.getSubmissionStats(
        targetUserId,
        challengeId as string
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submission stats',
      });
    }
  }
}
