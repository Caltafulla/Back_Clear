import { Challenge, CreateChallengeRequest, UpdateChallengeRequest, ChallengeStatus } from '../entities/Challenge';

export interface IChallengeRepository {
  findById(id: string): Promise<Challenge | null>;
  create(challengeData: CreateChallengeRequest, createdBy: string): Promise<Challenge>;
  update(id: string, challengeData: UpdateChallengeRequest): Promise<Challenge | null>;
  delete(id: string): Promise<boolean>;
  findByCourseId(courseId: string): Promise<Challenge[]>;
  findByStatus(status: ChallengeStatus): Promise<Challenge[]>;
  findByDifficulty(difficulty: string): Promise<Challenge[]>;
  findByTags(tags: string[]): Promise<Challenge[]>;
  findAll(limit?: number, offset?: number): Promise<Challenge[]>;
  search(query: string): Promise<Challenge[]>;
}

