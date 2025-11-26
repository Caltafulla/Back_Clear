import { ICourseRepository } from '../../domain/repositories/ICourseRepository';
import { Course, CreateCourseRequest, UpdateCourseRequest, CourseStudent } from '../../domain/entities/Course';

export class MockCourseRepository implements ICourseRepository {
  private courses: Course[] = [];
  private courseStudents: CourseStudent[] = [];

  async findById(id: string): Promise<Course | null> {
    return this.courses.find(c => c.id === id) || null;
  }

  async create(courseData: CreateCourseRequest): Promise<Course> {
    const course: Course = {
      id: `course-${Date.now()}`,
      ...courseData,
      studentIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.push(course);
    return course;
  }

  async update(id: string, courseData: UpdateCourseRequest): Promise<Course | null> {
    const index = this.courses.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const updatedCourse = {
      ...this.courses[index],
      ...courseData,
      updatedAt: new Date()
    } as Course;
    this.courses[index] = updatedCourse;
    return updatedCourse;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.courses.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.courses.splice(index, 1);
    return true;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Course[]> {
    return this.courses.slice(offset, offset + limit);
  }

  async findByProfessorId(professorId: string): Promise<Course[]> {
    return this.courses.filter(c => c.professorIds.includes(professorId));
  }

  async findByStudentId(studentId: string): Promise<Course[]> {
    return this.courses.filter(c => c.studentIds.includes(studentId));
  }

  async findByPeriod(period: string): Promise<Course[]> {
    return this.courses.filter(c => c.period === period);
  }

  async findByCode(code: string): Promise<Course | null> {
    return this.courses.find(c => c.code === code) || null;
  }

  async enrollStudent(courseId: string, studentId: string): Promise<CourseStudent> {
    const courseStudent: CourseStudent = {
      courseId,
      studentId,
      enrolledAt: new Date()
    };
    this.courseStudents.push(courseStudent);
    
    const course = this.courses.find(c => c.id === courseId);
    if (course && !course.studentIds.includes(studentId)) {
      course.studentIds.push(studentId);
    }
    
    return courseStudent;
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<boolean> {
    const index = this.courseStudents.findIndex(cs => cs.courseId === courseId && cs.studentId === studentId);
    if (index === -1) return false;
    
    this.courseStudents.splice(index, 1);
    
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      course.studentIds = course.studentIds.filter((id: string) => id !== studentId);
    }
    
    return true;
  }

  async getEnrolledStudents(courseId: string): Promise<CourseStudent[]> {
    return this.courseStudents.filter(cs => cs.courseId === courseId);
  }

  async isStudentEnrolled(courseId: string, studentId: string): Promise<boolean> {
    return this.courseStudents.some(cs => cs.courseId === courseId && cs.studentId === studentId);
  }
}
