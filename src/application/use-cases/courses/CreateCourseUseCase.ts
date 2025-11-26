import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Course, CreateCourseRequest } from '../../../domain/entities/Course';

export class CreateCourseUseCase {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(courseData: CreateCourseRequest, createdBy: string): Promise<Course> {
    // Check if course code already exists
    const existingCourse = await this.courseRepository.findByCode(courseData.code);
    if (existingCourse) {
      throw new Error('Course code already exists');
    }

    // Ensure the creator is in the professor list
    const professorIds = courseData.professorIds || [];
    if (!professorIds.includes(createdBy)) {
      professorIds.push(createdBy);
    }

    const course = await this.courseRepository.create({
      ...courseData,
      professorIds
    });

    return course;
  }
}

