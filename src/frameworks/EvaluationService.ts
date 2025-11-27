import { IEvaluationRepository } from '../domain/repositories/IEvaluationRepository';
import { ISubmissionRepository } from '../domain/repositories/ISubmissionRepository';
import { Evaluation, EvaluationStatus } from '../domain/entities/Evaluation';
import { Logger } from './Logger';

/**
 * EvaluationService: Provides evaluation-related business logic
 * 
 * Responsibilities:
 * - Find active evaluations by challenge
 * - Validate submission eligibility within evaluations
 * - Check attempt limits
 * - Enforce time window restrictions
 */
export class EvaluationService {
  private logger: Logger;

  constructor(
    private evaluationRepository: IEvaluationRepository,
    private submissionRepository: ISubmissionRepository
  ) {
    this.logger = new Logger('EvaluationService');
  }

  /**
   * Find an active evaluation that contains the given challenge
   * Returns the evaluation if found and currently active, null otherwise
   */
  async findActiveEvaluationByChallenge(challengeId: string): Promise<Evaluation | null> {
    try {
      return await this.evaluationRepository.findActiveByChallengeId(challengeId);
    } catch (error) {
      this.logger.error('Error finding active evaluation by challenge', { challengeId, error });
      return null;
    }
  }

  /**
   * Check if a user can submit for a given challenge within an evaluation
   * Returns { allowed: boolean, reason?: string }
   */
  async validateSubmissionEligibility(
    evaluationId: string,
    userId: string,
    challengeId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const evaluation = await this.evaluationRepository.findById(evaluationId);
      if (!evaluation) {
        return { allowed: false, reason: 'Evaluation not found' };
      }

      // Check evaluation status
      if (evaluation.status !== EvaluationStatus.ACTIVE) {
        return { allowed: false, reason: 'Evaluation is not active' };
      }

      // Check time window
      const now = new Date();
      if (now < evaluation.startDate) {
        return { allowed: false, reason: 'Evaluation has not started yet' };
      }
      if (now > evaluation.endDate) {
        return { allowed: false, reason: 'Evaluation period has ended' };
      }

      // Check if challenge is part of this evaluation
      if (!evaluation.challengeIds.includes(challengeId)) {
        return { allowed: false, reason: 'Challenge is not part of this evaluation' };
      }

      // Check attempt limit
      if (evaluation.maxAttempts > 0) {
        const attemptCount = await this.submissionRepository.findByChallengeId(challengeId);
        const userAttempts = attemptCount.filter(
          s => s.userId === userId && s.evaluationId === evaluationId
        ).length;

        if (userAttempts >= evaluation.maxAttempts) {
          return {
            allowed: false,
            reason: `Maximum attempts (${evaluation.maxAttempts}) reached for this challenge`
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      this.logger.error('Error validating submission eligibility', { evaluationId, userId, challengeId, error });
      // In case of error, allow submission (fail-open approach)
      return { allowed: true };
    }
  }

  /**
   * Get time remaining in evaluation (in minutes)
   */
  async getTimeRemaining(evaluationId: string): Promise<number> {
    try {
      const evaluation = await this.evaluationRepository.findById(evaluationId);
      if (!evaluation) {
        return 0;
      }

      const now = new Date();
      const endTime = new Date(evaluation.endDate).getTime();
      const nowTime = now.getTime();
      const minutesRemaining = Math.max(0, Math.floor((endTime - nowTime) / (1000 * 60)));

      return minutesRemaining;
    } catch (error) {
      this.logger.error('Error getting time remaining', { evaluationId, error });
      return 0;
    }
  }

  /**
   * Get user's remaining attempts for a challenge in evaluation
   */
  async getRemainingAttempts(
    evaluationId: string,
    userId: string,
    challengeId: string
  ): Promise<number> {
    try {
      const evaluation = await this.evaluationRepository.findById(evaluationId);
      if (!evaluation || evaluation.maxAttempts === 0) {
        // No limit if maxAttempts is 0
        return Number.MAX_SAFE_INTEGER;
      }

      const submissionsForChallenge = await this.submissionRepository.findByChallengeId(challengeId);
      const userSubmissions = submissionsForChallenge.filter(
        s => s.userId === userId && s.evaluationId === evaluationId
      );

      const remaining = Math.max(0, evaluation.maxAttempts - userSubmissions.length);
      return remaining;
    } catch (error) {
      this.logger.error('Error getting remaining attempts', { evaluationId, userId, challengeId, error });
      return 0;
    }
  }
}
