import { ILeaderboardRepository, LeaderboardOptions } from '../domain/repositories/ILeaderboardRepository';
import { Submission } from '../domain/entities/Submission';
import { IChallengeRepository } from '../domain/repositories/IChallengeRepository';
import { ICourseRepository } from '../domain/repositories/ICourseRepository';
import { IEvaluationRepository } from '../domain/repositories/IEvaluationRepository';

export class LeaderboardService {
  constructor(
    private leaderboardRepository: ILeaderboardRepository,
    private challengeRepo?: IChallengeRepository,
    private courseRepo?: ICourseRepository,
    private evaluationRepo?: IEvaluationRepository
  ) {}

  async updateChallengeLeaderboard(submission: Submission) {
    if (submission && submission.challengeId) {
      await this.leaderboardRepository.updateChallengeLeaderboard(submission.challengeId);
    }
  }

  async getChallengeLeaderboard(challengeId: string, options?: LeaderboardOptions) {
    return this.leaderboardRepository.getChallengeLeaderboard(challengeId, 50, options);
  }

  async getCourseLeaderboard(courseId: string, options?: LeaderboardOptions) {
    return this.leaderboardRepository.getCourseLeaderboard(courseId, 50, options);
  }

  async getEvaluationLeaderboard(evaluationId: string, options?: LeaderboardOptions) {
    return this.leaderboardRepository.getEvaluationLeaderboard(evaluationId, 50, options);
  }

  async updateCourseLeaderboardForSubmission(submission: Submission) {
    if (submission && submission.courseId) {
      await this.leaderboardRepository.updateCourseLeaderboard(submission.courseId);
    }
  }

  async updateEvaluationLeaderboardForSubmission(submission: Submission) {
    // If evaluations exist that include this challenge, update them
    if (!this.evaluationRepo || !submission || !submission.challengeId) return;
    const evaluations = await this.evaluationRepo.findByCourseId(submission.courseId);
    for (const ev of evaluations) {
      if (ev.challengeIds.includes(submission.challengeId)) {
        await this.leaderboardRepository.updateEvaluationLeaderboard(ev.id);
      }
    }
  }

  async recalculateAllLeaderboards() {
    // Recompute all challenge leaderboards
    if (this.challengeRepo) {
      const challenges = await this.challengeRepo.findAll(1000, 0);
      for (const c of challenges) {
        await this.leaderboardRepository.updateChallengeLeaderboard(c.id);
      }
    }

    // Recompute all course leaderboards
    if (this.courseRepo) {
      const courses = await this.courseRepo.findAll(1000, 0);
      for (const c of courses) {
        await this.leaderboardRepository.updateCourseLeaderboard(c.id);
      }
    }

    // Recompute all evaluation leaderboards
    if (this.evaluationRepo) {
      const evs = await this.evaluationRepo.findAll(1000, 0);
      for (const e of evs) {
        await this.leaderboardRepository.updateEvaluationLeaderboard(e.id);
      }
    }
  }
}
