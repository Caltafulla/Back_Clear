import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { IRunnerService } from '../../../domain/services/IRunnerService';
import { ILeaderboardRepository } from '../../../domain/repositories/ILeaderboardRepository';
import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
import { Submission, SubmissionResult, SubmissionStatus } from '../../../domain/entities/Submission';

export class ProcessSubmissionUseCase {
  constructor(
    private submissionRepository: ISubmissionRepository,
    private runnerService: IRunnerService,
    private leaderboardRepository: ILeaderboardRepository,
    private challengeRepository: IChallengeRepository
  ) {}

  async execute(submissionId: string): Promise<SubmissionResult> {
    // Get submission
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Update status to RUNNING
    await this.submissionRepository.update(submissionId, {
      status: SubmissionStatus.RUNNING
    });

    try {
      // Load challenge to obtain time/memory limits and test cases
      const challenge = await this.challengeRepository.findById(submission.challengeId);
      if (!challenge) {
        throw new Error('Challenge not found for submission');
      }

      const runnerResult = await this.runnerService.executeCode({
        language: submission.language,
        code: submission.code,
        timeLimit: challenge.timeLimit || 1500,
        memoryLimit: challenge.memoryLimit || 256,
        testCases: (challenge.testCases || []).map(tc => ({
          id: String(tc.id),
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: !!tc.isHidden,
        }))
      });

      // Update submission with results
      const updateData: Partial<Submission> = {
        status: runnerResult.status as SubmissionStatus,
        score: runnerResult.score,
        timeMsTotal: runnerResult.timeMsTotal,
        memoryKbTotal: runnerResult.memoryKbTotal,
        testCaseResults: runnerResult.testCaseResults.map(tc => ({
          ...tc,
          status: tc.status as SubmissionStatus
        }))
      };
      
      if (runnerResult.errorMessage) {
        updateData.errorMessage = runnerResult.errorMessage;
      }
      
      const updatedSubmission = await this.submissionRepository.update(submissionId, updateData);

      if (!updatedSubmission) {
        throw new Error('Failed to update submission');
      }

      // Update leaderboards
      await this.leaderboardRepository.updateChallengeLeaderboard(submission.challengeId);
      await this.leaderboardRepository.updateCourseLeaderboard(submission.courseId);

      const submissionResult: SubmissionResult = {
        submissionId: updatedSubmission.id,
        status: updatedSubmission.status,
        score: updatedSubmission.score,
        timeMsTotal: updatedSubmission.timeMsTotal,
        memoryKbTotal: updatedSubmission.memoryKbTotal,
        testCaseResults: updatedSubmission.testCaseResults
      };
      
      if (updatedSubmission.errorMessage) {
        submissionResult.errorMessage = updatedSubmission.errorMessage;
      }
      
      return submissionResult;

    } catch (error) {
      // Update submission with error
      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.RUNTIME_ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }
}

