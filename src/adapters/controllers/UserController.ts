import { Request, Response } from 'express';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/entities/User';

export class UserController {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get users by role
   */
  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.query;
      
      if (!role || typeof role !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Role parameter is required'
        });
        return;
      }

      // Validate role
      if (!Object.values(UserRole).includes(role as UserRole)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: STUDENT, PROFESSOR, ADMIN'
        });
        return;
      }

      const users = await this.userRepository.findByRole(role);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json({
        success: true,
        data: {
          users: usersWithoutPasswords
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get users by role'
      });
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
        return;
      }

      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user by email'
      });
    }
  }
}


