export enum EvaluationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface Evaluation {
  id: string;
  name: string;
  description: string;
  courseId: string;
  challengeIds: string[];
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  maxAttempts: number;
  status: EvaluationStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEvaluationRequest {
  name: string;
  description: string;
  courseId: string;
  challengeIds: string[];
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  maxAttempts: number;
}

export interface UpdateEvaluationRequest {
  name?: string;
  description?: string;
  challengeIds?: string[];
  startDate?: Date;
  endDate?: Date;
  durationMinutes?: number;
  maxAttempts?: number;
  status?: EvaluationStatus;
}

export interface EvaluationResult {
  studentId: string;
  evaluationId: string;
  totalScore: number;
  completedChallenges: number;
  totalChallenges: number;
  timeSpent: number; // in minutes
  submissions: {
    challengeId: string;
    bestScore: number;
    attempts: number;
  }[];
}

