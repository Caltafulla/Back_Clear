import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export class ValidationMiddleware {
  static validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      next();
    };
  }

  static validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.query);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      next();
    };
  }

  static validateParams(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.params);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Parameter validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      next();
    };
  }
}

// Validation schemas
export const AuthSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('STUDENT', 'ADMIN', 'PROFESSOR').optional()
  })
};

export const ChallengeSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    timeLimit: Joi.number().min(100).max(10000).required(),
    memoryLimit: Joi.number().min(64).max(1024).required(),
    courseId: Joi.string().required(),
    testCases: Joi.array().items(
      Joi.object({
        input: Joi.string().required(),
        expectedOutput: Joi.string().required(),
        isHidden: Joi.boolean().default(false),
        order: Joi.number().min(1).required()
      })
    ).min(1).required()
  }),
  
  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).optional(),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
    tags: Joi.array().items(Joi.string()).min(1).optional(),
    timeLimit: Joi.number().min(100).max(10000).optional(),
    memoryLimit: Joi.number().min(64).max(1024).optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    testCases: Joi.array().items(
      Joi.object({
        input: Joi.string().required(),
        expectedOutput: Joi.string().required(),
        isHidden: Joi.boolean().default(false),
        order: Joi.number().min(1).required()
      })
    ).min(1).optional()
  })
};

export const SubmissionSchemas = {
  create: Joi.object({
    challengeId: Joi.string().required(),
    courseId: Joi.string().required(),
    language: Joi.string().valid('python', 'javascript', 'cpp', 'java').required(),
    code: Joi.string().min(10).required()
  })
};

export const CourseSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(200).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().min(10).required(),
    period: Joi.string().required(),
    group: Joi.number().min(1).required(),
    professorIds: Joi.array().items(Joi.string()).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    code: Joi.string().min(2).max(20).optional(),
    description: Joi.string().min(10).optional(),
    period: Joi.string().optional(),
    group: Joi.number().min(1).optional(),
    professorIds: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional()
  }),

  enroll: Joi.object({
    studentId: Joi.string().required()
  })
};

export const EvaluationSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    courseId: Joi.string().required(),
    challengeIds: Joi.array().items(Joi.string()).min(1).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    durationMinutes: Joi.number().min(15).max(480).required(),
    maxAttempts: Joi.number().min(1).max(10).required()
  }),
  
  update: Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).optional(),
    challengeIds: Joi.array().items(Joi.string()).min(1).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    durationMinutes: Joi.number().min(15).max(480).optional(),
    maxAttempts: Joi.number().min(1).max(10).optional(),
    status: Joi.string().valid('draft', 'scheduled', 'active', 'finished', 'cancelled').optional()
  })
};

export const CommonSchemas = {
  id: Joi.object({
    id: Joi.string().required()
  }),
  
  pagination: Joi.object({
    limit: Joi.number().min(1).max(100).default(50),
    offset: Joi.number().min(0).default(0)
  }).unknown(true), // Allow additional query parameters
  
  challengeList: Joi.object({
    limit: Joi.number().min(1).max(100).default(50).optional(),
    offset: Joi.number().min(0).default(0).optional(),
    courseId: Joi.string().optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional()
  }),
  
  courseList: Joi.object({
    limit: Joi.number().min(1).max(100).default(50).optional(),
    offset: Joi.number().min(0).default(0).optional(),
    period: Joi.string().optional()
  }),
  
  submissionList: Joi.object({
    limit: Joi.number().min(1).max(100).default(50).optional(),
    offset: Joi.number().min(0).default(0).optional(),
    userId: Joi.string().optional(),
    challengeId: Joi.string().optional(),
    courseId: Joi.string().optional(),
    status: Joi.string().valid('pending', 'running', 'accepted', 'rejected', 'error').optional(),
    language: Joi.string().valid('python', 'javascript', 'cpp', 'java').optional()
  })
};

