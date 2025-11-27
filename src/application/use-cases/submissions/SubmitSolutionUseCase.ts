import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { EvaluationService } from '../../../frameworks/EvaluationService';
import { IJobQueueService } from '../../../domain/services/IJobQueueService';
import { CreateSubmissionRequest, CreateSubmissionWithUserRequest, Submission } from '../../../domain/entities/Submission';

export class SubmitSolutionUseCase {
  constructor(
    private submissionRepository: ISubmissionRepository,
    private challengeRepository: IChallengeRepository,
    private courseRepository: ICourseRepository,
    private evaluationService: EvaluationService,
    private jobQueueService: IJobQueueService
  ) {}

  async execute(request: CreateSubmissionRequest, userId: string): Promise<Submission> {
    // Verify challenge exists
    const challenge = await this.challengeRepository.findById(request.challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Verify course exists
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if user is enrolled in the course
    const isEnrolled = await this.courseRepository.isStudentEnrolled(request.courseId, userId);
    if (!isEnrolled) {
      throw new Error('Unauthorized: You are not enrolled in this course');
    }

    // Check if challenge is published
    if (challenge.status !== 'published') {
      throw new Error('Challenge is not available for submissions');
    }

    // Check if challenge is part of an active evaluation using EvaluationService
    let evaluationId: string | undefined = undefined;
    let activeEvaluation = null as any;

    try {
      activeEvaluation = await this.evaluationService.findActiveEvaluationByChallenge(request.challengeId);
      if (activeEvaluation) {
        const validation = await this.evaluationService.validateSubmissionEligibility(
          activeEvaluation.id,
          userId,
          request.challengeId
        );

        if (!validation.allowed) {
          throw new Error(validation.reason || 'Submission not allowed for this evaluation');
        }

        evaluationId = activeEvaluation.id;
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      // If unknown error, fail-open: allow submission
    }

    // Create submission with optional evaluationId
    const submissionData: CreateSubmissionWithUserRequest = {
      ...request,
      userId,
      evaluationId
    };
    const submission = await this.submissionRepository.create(submissionData);

    // Add to job queue for processing
    try {
      await this.jobQueueService.addSubmissionJob({
        submissionId: submission.id,
        userId: submission.userId,
        challengeId: submission.challengeId,
        courseId: submission.courseId,
        language: submission.language,
        code: submission.code,
        timeLimit: challenge.timeLimit,
        memoryLimit: challenge.memoryLimit,
        testCases: challenge.testCases.map(tc => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }))
      });
    } catch (queueError) {
      // If the job queue is down (e.g., Redis unavailable), do not fail the submission creation.
      // The submission remains in QUEUED state and can be reprocessed later.
      // Intentionally swallowing the error to avoid returning 5xx to the client.
    }

    return submission;
  }
}

