export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  score: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  averageTimeMs: number;
  rank: number;
}

export interface ChallengeLeaderboard {
  challengeId: string;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  lastUpdated: Date;
}

export interface CourseLeaderboard {
  courseId: string;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  lastUpdated: Date;
}

export interface EvaluationLeaderboard {
  evaluationId: string;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  lastUpdated: Date;
}

export enum LeaderboardType {
  CHALLENGE = 'challenge',
  COURSE = 'course',
  EVALUATION = 'evaluation'
}

export interface LeaderboardRequest {
  type: LeaderboardType;
  entityId: string;
  limit?: number;
  offset?: number;
}

