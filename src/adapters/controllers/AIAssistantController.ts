import { Request, Response } from 'express';
import { IAIAssistantService } from '../../domain/services/IAIAssistantService';

export class AIAssistantController {
  constructor(private aiAssistantService: IAIAssistantService) {}

  /**
   * @swagger
   * /api/ai/generate-challenges:
   *   post:
   *     summary: Generate challenge ideas using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - topic
   *             properties:
   *               topic:
   *                 type: string
   *                 example: "Dynamic Programming"
   *               count:
   *                 type: number
   *                 default: 3
   *                 minimum: 1
   *                 maximum: 10
   *     responses:
   *       200:
   *         description: Challenge ideas generated successfully
   *       400:
   *         description: Validation error
   */
  async generateChallenges(req: Request, res: Response): Promise<void> {
    try {
      const { topic, count = 3 } = req.body;

      if (!topic) {
        res.status(400).json({
          success: false,
          message: 'Topic is required'
        });
        return;
      }

      const suggestions = await this.aiAssistantService.generateChallengeIdeas(topic, count);

      res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate challenge ideas'
      });
    }
  }

  /**
   * @swagger
   * /api/ai/generate-test-cases:
   *   post:
   *     summary: Generate test cases for a challenge using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - challengeDescription
   *             properties:
   *               challengeDescription:
   *                 type: string
   *                 example: "Given an array of integers, find the maximum sum of a contiguous subarray"
   *               count:
   *                 type: number
   *                 default: 5
   *                 minimum: 1
   *                 maximum: 20
   *     responses:
   *       200:
   *         description: Test cases generated successfully
   *       400:
   *         description: Validation error
   */
  async generateTestCases(req: Request, res: Response): Promise<void> {
    try {
      const { challengeDescription, count = 5 } = req.body;

      if (!challengeDescription) {
        res.status(400).json({
          success: false,
          message: 'Challenge description is required'
        });
        return;
      }

      const testCases = await this.aiAssistantService.generateTestCases(challengeDescription, count);

      res.status(200).json({
        success: true,
        data: testCases
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate test cases'
      });
    }
  }

  /**
   * @swagger
   * /api/ai/validate-test-case:
   *   post:
   *     summary: Validate a test case using AI
   *     tags: [AI Assistant]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - input
   *               - expectedOutput
   *               - language
   *             properties:
   *               input:
   *                 type: string
   *                 example: "[1, 2, 3, 4, 5]"
   *               expectedOutput:
   *                 type: string
   *                 example: "15"
   *               language:
   *                 type: string
   *                 enum: [python, javascript, cpp, java]
   *                 example: "python"
   *     responses:
   *       200:
   *         description: Test case validation result
   *       400:
   *         description: Validation error
   */
  async validateTestCase(req: Request, res: Response): Promise<void> {
    try {
      const { input, expectedOutput, language } = req.body;

      if (!input || !expectedOutput || !language) {
        res.status(400).json({
          success: false,
          message: 'Input, expectedOutput, and language are required'
        });
        return;
      }

      const isValid = await this.aiAssistantService.validateTestCase(input, expectedOutput, language);

      res.status(200).json({
        success: true,
        data: {
          isValid,
          input,
          expectedOutput,
          language
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to validate test case'
      });
    }
  }
}

