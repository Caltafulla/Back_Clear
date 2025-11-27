import { 
  LeaderboardEntry, 
  ChallengeLeaderboard, 
  CourseLeaderboard, 
  EvaluationLeaderboard
} from '../entities/Leaderboard';
import { ProgrammingLanguage } from '../entities/Submission';

export interface LeaderboardOptions {
  language?: ProgrammingLanguage;
  from?: Date;
  to?: Date;
  /**
   * If true, include submissions created as part of evaluations (parciales).
   * Default behavior is to exclude them from challenge/course leaderboards.
   */
  includeEvaluationSubmissions?: boolean;
}

export interface ILeaderboardRepository {
  getChallengeLeaderboard(challengeId: string, limit?: number, options?: LeaderboardOptions): Promise<ChallengeLeaderboard>;
  getCourseLeaderboard(courseId: string, limit?: number, options?: LeaderboardOptions): Promise<CourseLeaderboard>;
  getEvaluationLeaderboard(evaluationId: string, limit?: number, options?: LeaderboardOptions): Promise<EvaluationLeaderboard>;
  updateChallengeLeaderboard(challengeId: string): Promise<void>;
  updateCourseLeaderboard(courseId: string): Promise<void>;
  updateEvaluationLeaderboard(evaluationId: string): Promise<void>;
  getUserRank(userId: string, type: string, entityId: string): Promise<number>;
  getTopPerformers(type: string, entityId: string, limit: number): Promise<LeaderboardEntry[]>;
}

