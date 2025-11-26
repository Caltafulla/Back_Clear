import { Course, CreateCourseRequest, UpdateCourseRequest, CourseStudent } from '../entities/Course';

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  create(courseData: CreateCourseRequest): Promise<Course>;
  update(id: string, courseData: UpdateCourseRequest): Promise<Course | null>;
  delete(id: string): Promise<boolean>;
  findAll(limit?: number, offset?: number): Promise<Course[]>;
  findByProfessorId(professorId: string): Promise<Course[]>;
  findByStudentId(studentId: string): Promise<Course[]>;
  findByPeriod(period: string): Promise<Course[]>;
  findByCode(code: string): Promise<Course | null>;
  enrollStudent(courseId: string, studentId: string): Promise<CourseStudent>;
  unenrollStudent(courseId: string, studentId: string): Promise<boolean>;
  getEnrolledStudents(courseId: string): Promise<CourseStudent[]>;
  isStudentEnrolled(courseId: string, studentId: string): Promise<boolean>;
}

