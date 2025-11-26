import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware, CourseSchemas, CommonSchemas } from '../middleware/validation';
import { ErrorHandler } from '../middleware/errorHandler';
import { UserRole } from '../../domain/entities/User';

export function createCourseRoutes(
  courseController: CourseController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware.authenticate);

  /**
   * @swagger
   * /api/courses:
   *   post:
   *     summary: Create a new course
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - code
   *               - description
   *               - period
   *               - group
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Algoritmos y Estructuras de Datos"
   *               code:
   *                 type: string
   *                 example: "CS101"
   *               description:
   *                 type: string
   *               period:
   *                 type: string
   *                 example: "2025-1"
   *               group:
   *                 type: number
   *                 example: 1
   *               professorIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Course created successfully
   *       400:
   *         description: Validation error
   */
  router.post(
    '/',
    authMiddleware.authorize(UserRole.ADMIN, UserRole.PROFESSOR),
    ValidationMiddleware.validate(CourseSchemas.create),
    ErrorHandler.asyncHandler(courseController.createCourse.bind(courseController))
  );

  /**
   * @swagger
   * /api/courses:
   *   get:
   *     summary: List all courses
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of courses
   */
  router.get(
    '/',
    ValidationMiddleware.validateQuery(CommonSchemas.courseList),
    ErrorHandler.asyncHandler(courseController.getCourses.bind(courseController))
  );

  /**
   * @swagger
   * /api/courses/{id}:
   *   get:
   *     summary: Get course by ID
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Course details
   *       404:
   *         description: Course not found
   */
  router.get(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ErrorHandler.asyncHandler(courseController.getCourseById.bind(courseController))
  );

  /**
   * @swagger
   * /api/courses/{id}:
   *   put:
   *     summary: Update course
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Course updated successfully
   *       404:
   *         description: Course not found
   */
  router.put(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ValidationMiddleware.validate(CourseSchemas.update),
    ErrorHandler.asyncHandler(courseController.updateCourse.bind(courseController))
  );

  /**
   * @swagger
   * /api/courses/{id}:
   *   delete:
   *     summary: Delete course
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Course deleted successfully
   *       404:
   *         description: Course not found
   */
  router.delete(
    '/:id',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    authMiddleware.authorize(UserRole.ADMIN, UserRole.PROFESSOR),
    ErrorHandler.asyncHandler(courseController.deleteCourse.bind(courseController))
  );

  /**
   * @swagger
   * /api/courses/{id}/enroll:
   *   post:
   *     summary: Enroll student in course
   *     tags: [Courses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - studentId
   *             properties:
   *               studentId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Student enrolled successfully
   *       400:
   *         description: Student already enrolled or validation error
   */
  router.post(
    '/:id/enroll',
    ValidationMiddleware.validateParams(CommonSchemas.id),
    ValidationMiddleware.validate(CourseSchemas.enroll),
    ErrorHandler.asyncHandler(courseController.enrollStudent.bind(courseController))
  );

  return router;
}

