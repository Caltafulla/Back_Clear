import { Submission, CreateSubmissionRequest, SubmissionStatus, ProgrammingLanguage } from '../entities/Submission';

export interface ISubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  create(submissionData: CreateSubmissionRequest): Promise<Submission>;
  update(id: string, updates: Partial<Submission>): Promise<Submission | null>;
  findByUserId(userId: string): Promise<Submission[]>;
  findByChallengeId(challengeId: string): Promise<Submission[]>;
  findByCourseId(courseId: string): Promise<Submission[]>;
  findByStatus(status: SubmissionStatus): Promise<Submission[]>;
  findByLanguage(language: ProgrammingLanguage): Promise<Submission[]>;
  findBestSubmissionByUserAndChallenge(userId: string, challengeId: string): Promise<Submission | null>;
  findRecentSubmissions(limit?: number, offset?: number): Promise<Submission[]>;
  getSubmissionStats(userId?: string, challengeId?: string): Promise<{
    total: number;
    accepted: number;
    failed: number;
    averageTime: number;
  }>;
}

