import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../frameworks/Logger';

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  static handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    try {
      ErrorHandler.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      // Fallback if logger fails
      console.error('Error logging failed:', logError);
      console.error('Original error:', error.message, error.stack);
    }

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation error';
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Forbidden';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (error.name === 'ConflictError') {
      statusCode = 409;
      message = 'Resource conflict';
    } else if (error.name === 'RateLimitError') {
      statusCode = 429;
      message = 'Too many requests';
    }

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }

  static notFound(req: Request, res: Response): void {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.url} not found`
    });
  }

  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

