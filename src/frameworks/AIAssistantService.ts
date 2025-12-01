import { IAIAssistantService, ChallengeSuggestion } from '../domain/services/IAIAssistantService';

// Provider types
type AIProvider = 'openai' | 'groq' | 'gemini' | 'together' | 'ollama';

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
}

export class AIAssistantService implements IAIAssistantService {
  private readonly config: AIConfig;

  constructor() {
    // Determine which provider to use based on environment variables
    if (process.env.GROQ_API_KEY) {
      this.config = { provider: 'groq', apiKey: process.env.GROQ_API_KEY };
    } else if (process.env.GEMINI_API_KEY) {
      this.config = { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY };
    } else if (process.env.TOGETHER_API_KEY) {
      this.config = { provider: 'together', apiKey: process.env.TOGETHER_API_KEY };
    } else if (process.env.OLLAMA_BASE_URL) {
      this.config = { provider: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' };
    } else if (process.env.OPENAI_API_KEY) {
      this.config = { provider: 'openai', apiKey: process.env.OPENAI_API_KEY };
    } else {
      this.config = { provider: 'groq', apiKey: '' }; // Default to Groq (free tier)
    }
  }

  private hasAPIKey(): boolean {
    return !!this.config.apiKey || this.config.provider === 'ollama';
  }

  private async callAI(prompt: string, systemPrompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 3000, jsonMode = false } = options;

    switch (this.config.provider) {
      case 'groq':
        return this.callGroq(prompt, systemPrompt, temperature, maxTokens, jsonMode);
      case 'gemini':
        return this.callGemini(prompt, systemPrompt, temperature, maxTokens, jsonMode);
      case 'together':
        return this.callTogether(prompt, systemPrompt, temperature, maxTokens, jsonMode);
      case 'ollama':
        return this.callOllama(prompt, systemPrompt, temperature, maxTokens, jsonMode);
      case 'openai':
        return this.callOpenAI(prompt, systemPrompt, temperature, maxTokens, jsonMode);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  private async callGroq(prompt: string, systemPrompt: string, temperature: number, maxTokens: number, jsonMode: boolean): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('GROQ_API_KEY is not configured. Get a free API key at https://console.groq.com');
    }

    // Try multiple models in order of preference
    const models = [
      'llama-3.1-8b-instant',      // Fast and reliable
      'llama-3.3-70b-versatile',    // More capable
      'mixtral-8x7b-32768',         // Alternative option
      'llama-3.1-70b-versatile'     // Fallback
    ];

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens,
            ...(jsonMode && { response_format: { type: 'json_object' } })
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          
          // If model is decommissioned, try next model
          if (errorData.error?.code === 'model_decommissioned') {
            console.warn(`Model ${model} is decommissioned, trying next model...`);
            lastError = new Error(`Model ${model} is decommissioned`);
            continue;
          }
          
          throw new Error(`Groq API error: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      } catch (error) {
        // If it's a decommissioned model error, try next model
        if (error instanceof Error && error.message.includes('decommissioned')) {
          lastError = error;
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All Groq models failed. Please check https://console.groq.com/docs/models for available models.');
  }

  private async callGemini(prompt: string, systemPrompt: string, temperature: number, maxTokens: number, jsonMode: boolean): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Get a free API key at https://makersuite.google.com/app/apikey');
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai' as any);
      const genAI = new GoogleGenerativeAI(this.config.apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // Free tier model
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(jsonMode && { responseMimeType: 'application/json' })
        }
      });

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callTogether(prompt: string, systemPrompt: string, temperature: number, maxTokens: number, jsonMode: boolean): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('TOGETHER_API_KEY is not configured. Get a free API key at https://api.together.xyz');
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf', // Free tier model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Together AI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callOllama(prompt: string, systemPrompt: string, temperature: number, maxTokens: number, jsonMode: boolean): Promise<string> {
    const baseURL = this.config.baseURL || 'http://localhost:11434';
    
    const response = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2', // Default model, can be changed
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        options: {
          temperature,
          num_predict: maxTokens,
        },
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  private async callOpenAI(prompt: string, systemPrompt: string, temperature: number, maxTokens: number, jsonMode: boolean): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    try {
      const { default: OpenAI } = await import('openai' as any);
      const openai = new OpenAI({ apiKey: this.config.apiKey });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } })
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChallengeIdeas(topic: string, count: number = 3): Promise<ChallengeSuggestion[]> {
    if (!this.hasAPIKey()) {
      throw new Error(
        'No AI provider configured. Please set one of: GROQ_API_KEY (recommended, free), GEMINI_API_KEY (free), TOGETHER_API_KEY (free), OLLAMA_BASE_URL (local), or OPENAI_API_KEY'
      );
    }

    try {
      const prompt = `Generate ${count} programming challenge ideas about "${topic}". 

For each challenge, provide:
- A clear, descriptive title
- A detailed description explaining the problem
- Difficulty level (Easy, Medium, or Hard)
- Relevant tags (array of strings)
- Suggested time limit in milliseconds (typically 1000-5000)
- Suggested memory limit in MB (typically 128-512)
- At least 2 examples with input, output, and explanation
- At least 3 test cases with input, expectedOutput, and isHidden (boolean)

Return the response as a JSON object with a "challenges" array:
{
  "challenges": [
    {
      "title": "Challenge Title",
      "description": "Detailed problem description...",
      "difficulty": "Easy|Medium|Hard",
      "tags": ["tag1", "tag2"],
      "timeLimit": 1000,
      "memoryLimit": 128,
      "examples": [
        {
          "input": "example input",
          "output": "example output",
          "explanation": "explanation of the example"
        }
      ],
      "testCases": [
        {
          "input": "test input",
          "expectedOutput": "expected output",
          "isHidden": false
        }
      ]
    }
  ]
}

Make sure the challenges are relevant to "${topic}" and are appropriate for a coding challenge platform.`;

      const systemPrompt = 'You are an expert programming challenge creator. Generate high-quality coding challenges with clear descriptions, examples, and test cases. Always respond with valid JSON only, no markdown formatting.';

      const content = await this.callAI(prompt, systemPrompt, {
        temperature: 0.7,
        maxTokens: 4000,
        jsonMode: true
      });

      // Parse JSON response
      let parsed: any;
      try {
        const jsonObj = JSON.parse(content);
        parsed = jsonObj.challenges || jsonObj.data || (Array.isArray(jsonObj) ? jsonObj : [jsonObj]);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
      } catch (parseError) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }
          } catch {
            throw new Error('Failed to parse AI response as JSON');
          }
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }

      // Validate and normalize
      const suggestions: ChallengeSuggestion[] = [];
      for (const item of parsed.slice(0, count)) {
        if (item.title && item.description) {
          suggestions.push({
            title: String(item.title),
            description: String(item.description),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [topic.toLowerCase()],
            timeLimit: Number(item.timeLimit) || 2000,
            memoryLimit: Number(item.memoryLimit) || 256,
            examples: Array.isArray(item.examples) ? item.examples.map((ex: any) => ({
              input: String(ex.input || ''),
              output: String(ex.output || ''),
              explanation: String(ex.explanation || '')
            })) : [],
            testCases: Array.isArray(item.testCases) ? item.testCases.map((tc: any) => ({
              input: String(tc.input || ''),
              expectedOutput: String(tc.expectedOutput || ''),
              isHidden: Boolean(tc.isHidden)
            })) : []
          });
        }
      }

      if (suggestions.length === 0) {
        throw new Error('No valid challenge suggestions generated');
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating challenge ideas:', error);
      throw new Error(`Failed to generate challenge ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTestCases(challengeDescription: string, count: number = 5): Promise<Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>> {
    if (!this.hasAPIKey()) {
      throw new Error(
        'No AI provider configured. Please set one of: GROQ_API_KEY (recommended, free), GEMINI_API_KEY (free), TOGETHER_API_KEY (free), OLLAMA_BASE_URL (local), or OPENAI_API_KEY'
      );
    }

    try {
      const prompt = `Generate ${count} test cases for the following programming challenge:

${challengeDescription}

For each test case, provide:
- input: The input data as a string (can be JSON, array, or plain text format)
- expectedOutput: The expected output as a string
- isHidden: A boolean indicating if this test case should be hidden from users (typically, first 2-3 are visible, rest are hidden)

Return the response as a JSON object:
{
  "testCases": [
    {
      "input": "test input data",
      "expectedOutput": "expected output",
      "isHidden": false
    }
  ]
}

Make sure the test cases cover:
1. Basic/typical cases
2. Edge cases (empty inputs, single element, etc.)
3. Large/complex cases
4. Boundary conditions`;

      const systemPrompt = 'You are an expert at creating test cases for programming challenges. Generate comprehensive test cases that cover various scenarios. Always respond with valid JSON only, no markdown formatting.';

      const content = await this.callAI(prompt, systemPrompt, {
        temperature: 0.5,
        maxTokens: 3000,
        jsonMode: true
      });

      // Parse JSON response
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }

      const testCases = parsed.testCases || parsed.cases || (Array.isArray(parsed) ? parsed : []);
      
      const result = [];
      for (const tc of testCases.slice(0, count)) {
        if (tc.input !== undefined && tc.expectedOutput !== undefined) {
          result.push({
            input: String(tc.input),
            expectedOutput: String(tc.expectedOutput),
            isHidden: Boolean(tc.isHidden !== undefined ? tc.isHidden : result.length >= 2)
          });
        }
      }

      if (result.length === 0) {
        throw new Error('No valid test cases generated');
      }

      return result;
    } catch (error) {
      console.error('Error generating test cases:', error);
      throw new Error(`Failed to generate test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateTestCase(input: string, expectedOutput: string, language: string): Promise<boolean> {
    if (!this.hasAPIKey()) {
      return input.length > 0 && expectedOutput.length > 0;
    }

    try {
      const prompt = `Validate if the following test case is logically consistent:

Input: ${input}
Expected Output: ${expectedOutput}
Language: ${language}

Determine if the expected output is a reasonable/possible result for the given input. Consider:
- Type consistency (input type matches expected output type)
- Logical correctness (the output makes sense for the input)
- Format consistency (if input is JSON, output should be appropriate format)

Respond with a JSON object:
{
  "isValid": true/false,
  "reason": "brief explanation"
}`;

      const systemPrompt = 'You are an expert at validating test cases for programming challenges. Analyze if test cases are logically consistent. Always respond with valid JSON only.';

      const content = await this.callAI(prompt, systemPrompt, {
        temperature: 0.3,
        maxTokens: 500,
        jsonMode: true
      });

      try {
        const parsed = JSON.parse(content);
        return Boolean(parsed.isValid);
      } catch {
        return input.length > 0 && expectedOutput.length > 0;
      }
    } catch (error) {
      console.error('Error validating test case:', error);
      return input.length > 0 && expectedOutput.length > 0;
    }
  }

  async suggestImprovements(challengeDescription: string): Promise<string[]> {
    if (!this.hasAPIKey()) {
      return [
        'Consider adding edge cases for empty inputs',
        'Add time complexity requirements',
        'Include examples with different data types',
        'Specify input/output format more clearly',
        'Add constraints on input size'
      ];
    }

    try {
      const prompt = `Review the following programming challenge description and suggest improvements:

${challengeDescription}

Provide 5-7 specific, actionable suggestions to improve the challenge description. Focus on:
- Clarity and completeness
- Missing edge cases or constraints
- Input/output format specifications
- Examples that could be added
- Potential ambiguities

Return as a JSON object:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

      const systemPrompt = 'You are an expert at reviewing and improving programming challenge descriptions. Provide constructive, specific suggestions. Always respond with valid JSON only.';

      const content = await this.callAI(prompt, systemPrompt, {
        temperature: 0.5,
        maxTokens: 1000,
        jsonMode: true
      });

      try {
        const parsed = JSON.parse(content);
        const suggestions = parsed.suggestions || parsed.improvements || [];
        return Array.isArray(suggestions) ? suggestions.map(String) : [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}
