export enum ChallengeDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum ChallengeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface TestCase {
  id: string;
  challengeId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
  createdAt: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
  status: ChallengeStatus;
  courseId: string;
  createdBy: string;
  testCases: TestCase[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChallengeRequest {
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  courseId: string;
  testCases: Omit<TestCase, 'id' | 'challengeId' | 'createdAt'>[];
}

export interface UpdateChallengeRequest {
  title?: string;
  description?: string;
  difficulty?: ChallengeDifficulty;
  tags?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  status?: ChallengeStatus;
  testCases?: Omit<TestCase, 'id' | 'challengeId' | 'createdAt'>[];
}

