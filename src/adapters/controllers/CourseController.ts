import { Request, Response } from 'express';
import { ICourseRepository } from '../../domain/repositories/ICourseRepository';
import { CreateCourseUseCase } from '../../application/use-cases/courses/CreateCourseUseCase';

export class CourseController {
  constructor(
    private createCourseUseCase: CreateCourseUseCase,
    private courseRepository: ICourseRepository
  ) {}

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
   *                 example: "Curso introductorio de algoritmos"
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
   *       401:
   *         description: Unauthorized
   */
  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const course = await this.createCourseUseCase.execute(req.body, userId);

      res.status(201).json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create course'
      });
    }
  }

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
  async getCourses(req: Request, res: Response): Promise<void> {
    try {
      const { period, limit = 50, offset = 0 } = req.query;

      let courses;

      if (period) {
        courses = await this.courseRepository.findByPeriod(period as string);
      } else {
        courses = await this.courseRepository.findAll(
          parseInt(limit as string),
          parseInt(offset as string)
        );
      }

      res.status(200).json({
        success: true,
        data: courses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch courses'
      });
    }
  }

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
  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }
      const course = await this.courseRepository.findById(id);

      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course'
      });
    }
  }

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
   *             properties:
   *               name:
   *                 type: string
   *               code:
   *                 type: string
   *               description:
   *                 type: string
   *               period:
   *                 type: string
   *               group:
   *                 type: number
   *               professorIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Course updated successfully
   *       404:
   *         description: Course not found
   */
  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const course = await this.courseRepository.update(id, req.body);

      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update course'
      });
    }
  }

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
  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const deleted = await this.courseRepository.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete course'
      });
    }
  }

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
  async enrollStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
        return;
      }

      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
        return;
      }

      // Check if already enrolled
      const isEnrolled = await this.courseRepository.isStudentEnrolled(id, studentId);
      if (isEnrolled) {
        res.status(400).json({
          success: false,
          message: 'Student is already enrolled in this course'
        });
        return;
      }

      const enrollment = await this.courseRepository.enrollStudent(id, studentId);

      res.status(200).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to enroll student'
      });
    }
  }
}

