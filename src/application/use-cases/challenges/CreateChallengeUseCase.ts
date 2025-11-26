import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { CreateChallengeRequest, Challenge } from '../../../domain/entities/Challenge';
import { UserRole } from '../../../domain/entities/User';

export class CreateChallengeUseCase {
  constructor(
    private challengeRepository: IChallengeRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute(request: CreateChallengeRequest, userId: string, userRole?: UserRole): Promise<Challenge> {
    // Verify course exists
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new Error(`Course not found: ${request.courseId}. Please create the course first or use an existing course ID.`);
    }

    // ADMIN can create challenges for any course
    // PROFESSOR can create challenges only for courses where they are listed as professor
    if (userRole !== UserRole.ADMIN) {
      if (course.professorIds.length > 0 && !course.professorIds.includes(userId)) {
        throw new Error('Unauthorized: Only course professors can create challenges. Make sure you are added as a professor to this course.');
      }
    }

    // Validate test cases
    if (!request.testCases || request.testCases.length === 0) {
      throw new Error('At least one test case is required');
    }

    // Create challenge with createdBy
    const challengeData: CreateChallengeRequest = {
      ...request,
      testCases: request.testCases.map((testCase, index) => ({
        ...testCase,
        order: index + 1
      }))
    };

    return await this.challengeRepository.create(challengeData, userId);
  }
}

