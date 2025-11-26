import { IEvaluationRepository } from '../../../domain/repositories/IEvaluationRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Evaluation, CreateEvaluationRequest } from '../../../domain/entities/Evaluation';

export class CreateEvaluationUseCase {
  constructor(
    private evaluationRepository: IEvaluationRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute(evaluationData: CreateEvaluationRequest, createdBy: string): Promise<Evaluation> {
    // Verify course exists
    const course = await this.courseRepository.findById(evaluationData.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Verify course is active
    if (!course.isActive) {
      throw new Error('Cannot create evaluation for inactive course');
    }

    const evaluation = await this.evaluationRepository.create(evaluationData, createdBy);

    return evaluation;
  }
}

