import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthMiddleware } from '../middleware/auth';
import { ErrorHandler } from '../middleware/errorHandler';
import { UserRole } from '../../domain/entities/User';

export function createUserRoutes(
  userController: UserController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get users by role
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         required: true
   *         schema:
   *           type: string
   *           enum: [STUDENT, PROFESSOR, ADMIN]
   *     responses:
   *       200:
   *         description: List of users
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/',
    authMiddleware.authorize(UserRole.ADMIN, UserRole.PROFESSOR),
    ErrorHandler.asyncHandler(userController.getUsersByRole.bind(userController))
  );

  /**
   * @swagger
   * /api/users/email/{email}:
   *   get:
   *     summary: Get user by email
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: User found
   *       404:
   *         description: User not found
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/email/:email',
    authMiddleware.authorize(UserRole.ADMIN, UserRole.PROFESSOR),
    ErrorHandler.asyncHandler(userController.getUserByEmail.bind(userController))
  );

  return router;
}

