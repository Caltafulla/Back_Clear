import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { JobQueueService } from '../../../frameworks/JobQueueService';
import { ProgrammingLanguage, Submission } from '../../../domain/entities/Submission';

export interface SubmitSolutionInput {
  userId: string;            // viene del JWT (req.user.id)
  challengeId: string;
  courseId: string;
  language: ProgrammingLanguage;
  code: string;
  evaluationId?: string;
}

export class SubmitSolutionUseCase {
  constructor(
    private readonly submissionRepository: ISubmissionRepository,
    private readonly jobQueueService: JobQueueService,
  ) {}

  async execute(input: SubmitSolutionInput): Promise<Submission> {
    // 1) Crear la submission en Mongo
    const submission = await this.submissionRepository.create({
      userId: input.userId,
      challengeId: input.challengeId,
      courseId: input.courseId,
      language: input.language,
      code: input.code,
      evaluationId: input.evaluationId,
    });

    // 2) Encolar el trabajo para el runner
    await this.jobQueueService.enqueueSubmission({
      submissionId: submission.id,
      userId: input.userId,
      challengeId: input.challengeId,
      language: input.language,
    });

    return submission;
  }
}
