import { ILeaderboardRepository } from '../../domain/repositories/ILeaderboardRepository';
import { LeaderboardEntry, ChallengeLeaderboard, CourseLeaderboard, EvaluationLeaderboard } from '../../domain/entities/Leaderboard';

export class MockLeaderboardRepository implements ILeaderboardRepository {
  async getChallengeLeaderboard(challengeId: string, limit: number = 50): Promise<ChallengeLeaderboard> {
    // Mock implementation
    return {
      challengeId,
      entries: [],
      totalParticipants: 0,
      lastUpdated: new Date()
    };
  }

  async getCourseLeaderboard(courseId: string, limit: number = 50): Promise<CourseLeaderboard> {
    // Mock implementation
    return {
      courseId,
      entries: [],
      totalParticipants: 0,
      lastUpdated: new Date()
    };
  }

  async getEvaluationLeaderboard(evaluationId: string, limit: number = 50): Promise<EvaluationLeaderboard> {
    // Mock implementation
    return {
      evaluationId,
      entries: [],
      totalParticipants: 0,
      lastUpdated: new Date()
    };
  }

  async updateChallengeLeaderboard(challengeId: string): Promise<void> {
    // Mock implementation - would update leaderboard in real scenario
  }

  async updateCourseLeaderboard(courseId: string): Promise<void> {
    // Mock implementation - would update leaderboard in real scenario
  }

  async updateEvaluationLeaderboard(evaluationId: string): Promise<void> {
    // Mock implementation - would update leaderboard in real scenario
  }

  async getUserRank(userId: string, type: string, entityId: string): Promise<number> {
    // Mock implementation
    return 1;
  }

  async getTopPerformers(type: string, entityId: string, limit: number): Promise<LeaderboardEntry[]> {
    // Mock implementation
    return [];
  }
}
