import winston from 'winston';
import path from 'path';

export class Logger {
  private logger: winston.Logger;

  constructor(service: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service },
      transports: [
        new winston.transports.File({
          filename: path.join(process.env.LOG_FILE || './logs/error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(process.env.LOG_FILE || './logs/combined.log')
        })
      ]
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // Structured logging for submissions
  logSubmission(submissionId: string, event: string, data?: any): void {
    this.info(`Submission ${event}`, {
      submissionId,
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Structured logging for API requests
  logRequest(req: any, res: any, responseTime: number): void {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    });
  }
}

