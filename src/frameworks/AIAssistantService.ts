import { IAIAssistantService, ChallengeSuggestion } from '../domain/services/IAIAssistantService';

export class AIAssistantService implements IAIAssistantService {
  private readonly openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateChallengeIdeas(topic: string, count: number = 3): Promise<ChallengeSuggestion[]> {
    // Mock implementation - in real scenario, this would call OpenAI API
    const mockChallenges: ChallengeSuggestion[] = [
      {
        title: `${topic} - Basic Implementation`,
        description: `Implement a basic solution for ${topic}. This challenge focuses on understanding the fundamental concepts.`,
        difficulty: 'Easy',
        tags: [topic.toLowerCase(), 'basics'],
        timeLimit: 1000,
        memoryLimit: 128,
        examples: [
          {
            input: 'Sample input',
            output: 'Expected output',
            explanation: 'This example demonstrates the basic case.'
          }
        ],
        testCases: [
          {
            input: 'test input 1',
            expectedOutput: 'expected output 1',
            isHidden: false
          },
          {
            input: 'test input 2',
            expectedOutput: 'expected output 2',
            isHidden: true
          }
        ]
      },
      {
        title: `${topic} - Advanced Problem`,
        description: `Solve a more complex problem involving ${topic}. This requires deeper understanding and optimization.`,
        difficulty: 'Medium',
        tags: [topic.toLowerCase(), 'advanced', 'optimization'],
        timeLimit: 2000,
        memoryLimit: 256,
        examples: [
          {
            input: 'Complex input',
            output: 'Complex output',
            explanation: 'This example shows the advanced scenario.'
          }
        ],
        testCases: [
          {
            input: 'complex test input 1',
            expectedOutput: 'complex expected output 1',
            isHidden: false
          },
          {
            input: 'complex test input 2',
            expectedOutput: 'complex expected output 2',
            isHidden: true
          }
        ]
      }
    ];

    return mockChallenges.slice(0, count);
  }

  async generateTestCases(challengeDescription: string, count: number = 5): Promise<Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>> {
    // Mock implementation
    const testCases = [];
    
    for (let i = 0; i < count; i++) {
      testCases.push({
        input: `Test input ${i + 1} for: ${challengeDescription}`,
        expectedOutput: `Expected output ${i + 1}`,
        isHidden: i >= 2 // First 2 are visible, rest are hidden
      });
    }

    return testCases;
  }

  async validateTestCase(input: string, expectedOutput: string, language: string): Promise<boolean> {
    // Mock validation - in real scenario, this would run the test case
    // to ensure it produces the expected output
    return input.length > 0 && expectedOutput.length > 0;
  }

  async suggestImprovements(challengeDescription: string): Promise<string[]> {
    // Mock suggestions
    return [
      'Consider adding edge cases for empty inputs',
      'Add time complexity requirements',
      'Include examples with different data types',
      'Specify input/output format more clearly',
      'Add constraints on input size'
    ];
  }
}

