import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ValidationMiddleware, AuthSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: User login
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                     user:
   *                       type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid credentials
   */
  router.post(
    '/login',
    ValidationMiddleware.validate(AuthSchemas.login),
    ErrorHandler.asyncHandler(authController.login.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: User registration
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 example: "password123"
   *               firstName:
   *                 type: string
   *                 example: "John"
   *               lastName:
   *                 type: string
   *                 example: "Doe"
   *               role:
   *                 type: string
   *                 enum: [STUDENT, ADMIN, PROFESSOR]
   *                 default: STUDENT
   *     responses:
   *       201:
   *         description: Registration successful
   *       400:
   *         description: Validation error
   */
  router.post(
    '/register',
    ValidationMiddleware.validate(AuthSchemas.register),
    ErrorHandler.asyncHandler(authController.register.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/me',
    ErrorHandler.asyncHandler(authController.me.bind(authController))
  );

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh JWT token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Unauthorized
   */
  router.post(
    '/refresh',
    ErrorHandler.asyncHandler(authController.refreshToken.bind(authController))
  );

  return router;
}

