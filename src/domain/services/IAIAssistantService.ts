export interface ChallengeSuggestion {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
}

export interface IAIAssistantService {
  generateChallengeIdeas(topic: string, count?: number): Promise<ChallengeSuggestion[]>;
  generateTestCases(challengeDescription: string, count?: number): Promise<Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>>;
  validateTestCase(input: string, expectedOutput: string, language: string): Promise<boolean>;
  suggestImprovements(challengeDescription: string): Promise<string[]>;
}

