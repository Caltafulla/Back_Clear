import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../domain/services/IAuthService';
import { UserRole } from '../../domain/entities/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

export class AuthMiddleware {
  constructor(private authService: IAuthService) {}

  authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
        return;
      }

      const decoded = this.authService.verifyToken(token);
      
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role as UserRole,
        email: '' // Will be populated if needed
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token validation failed'
      });
    }
  };

  authorize = (...roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        const decoded = this.authService.verifyToken(token);
        if (decoded) {
          req.user = {
            userId: decoded.userId,
            role: decoded.role as UserRole,
            email: ''
          };
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  };
}

