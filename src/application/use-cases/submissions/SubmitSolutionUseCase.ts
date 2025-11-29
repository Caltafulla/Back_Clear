import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { JobQueueService } from '../../../frameworks/JobQueueService';
import { ProgrammingLanguage } from '../../../domain/entities/Submission';

export interface SubmitSolutionInput {
  userId: string;
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

  async execute(input: SubmitSolutionInput) {
    const submission = await this.submissionRepository.create({
      userId: input.userId,        // ✔ permitido si tu repo usa CreateSubmissionWithUserRequest
      challengeId: input.challengeId,
      courseId: input.courseId,
      language: input.language,
      code: input.code,
      evaluationId: input.evaluationId,
    });

    await this.jobQueueService.enqueueSubmission({
      submissionId: submission.id,
      userId: input.userId,
      challengeId: input.challengeId,
      language: input.language,
    });

    return submission;
  }
}
