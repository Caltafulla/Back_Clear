import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { IEvaluationRepository } from '../../../domain/repositories/IEvaluationRepository';
import { IJobQueueService } from '../../../domain/services/IJobQueueService';
import { CreateSubmissionRequest, CreateSubmissionWithUserRequest, Submission } from '../../../domain/entities/Submission';
import { EvaluationStatus } from '../../../domain/entities/Evaluation';

export class SubmitSolutionUseCase {
  constructor(
    private submissionRepository: ISubmissionRepository,
    private challengeRepository: IChallengeRepository,
    private courseRepository: ICourseRepository,
    private evaluationRepository: IEvaluationRepository,
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

    // Check if challenge is part of an active evaluation
    let evaluationId: string | undefined = undefined;
    let activeEvaluation = null;
    
    try {
      const evaluations = await this.evaluationRepository.findByCourseId(request.courseId);
      if (!evaluations || evaluations.length === 0) {
        // No evaluations for this course
      } else {
        const now = new Date();
        
        activeEvaluation = evaluations.find(
          e => e.challengeIds.includes(request.challengeId) &&
            e.status === EvaluationStatus.ACTIVE &&
            e.startDate <= now &&
            e.endDate >= now
        );

        if (activeEvaluation) {
          evaluationId = activeEvaluation.id;

          // Verify within time window
          if (now > activeEvaluation.endDate) {
            throw new Error('Evaluation period has ended');
          }

          // Check attempt limit
          if (activeEvaluation.maxAttempts > 0) {
            const userSubmissions = await this.submissionRepository.findByChallengeId(request.challengeId);
            const attemptCount = userSubmissions.filter(
              s => s.userId === userId && s.evaluationId === evaluationId
            ).length;

            if (attemptCount >= activeEvaluation.maxAttempts) {
              throw new Error(
                `Maximum attempts (${activeEvaluation.maxAttempts}) reached for this challenge in the evaluation`
              );
            }
          }
        }
      }
    } catch (error) {
      // If error is a validation error we want to propagate, check the message
      if (error instanceof Error && error.message.includes('Maximum attempts')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Evaluation period')) {
        throw error;
      }
      // Otherwise, log but don't fail the submission - evaluation might not be available
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

