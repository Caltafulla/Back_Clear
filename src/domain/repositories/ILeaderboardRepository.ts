import { 
  LeaderboardEntry, 
  ChallengeLeaderboard, 
  CourseLeaderboard, 
  EvaluationLeaderboard,
  LeaderboardRequest 
} from '../entities/Leaderboard';

export interface ILeaderboardRepository {
  getChallengeLeaderboard(challengeId: string, limit?: number): Promise<ChallengeLeaderboard>;
  getCourseLeaderboard(courseId: string, limit?: number): Promise<CourseLeaderboard>;
  getEvaluationLeaderboard(evaluationId: string, limit?: number): Promise<EvaluationLeaderboard>;
  updateChallengeLeaderboard(challengeId: string): Promise<void>;
  updateCourseLeaderboard(courseId: string): Promise<void>;
  updateEvaluationLeaderboard(evaluationId: string): Promise<void>;
  getUserRank(userId: string, type: string, entityId: string): Promise<number>;
  getTopPerformers(type: string, entityId: string, limit: number): Promise<LeaderboardEntry[]>;
}

