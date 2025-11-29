import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { IRunnerService, RunnerConfig } from '../../../domain/services/IRunnerService';
import { ILeaderboardRepository } from '../../../domain/repositories/ILeaderboardRepository';
import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
import {
  Submission,
  SubmissionResult,
  SubmissionStatus,
} from '../../../domain/entities/Submission';
import { Logger } from '../../../frameworks/Logger';

export class ProcessSubmissionUseCase {
  private readonly logger: Logger;

  constructor(
    private readonly submissionRepository: ISubmissionRepository,
    private readonly runnerService: IRunnerService,
    private readonly leaderboardRepository: ILeaderboardRepository,
    private readonly challengeRepository: IChallengeRepository,
  ) {
    this.logger = new Logger('ProcessSubmissionUseCase');
  }

  async execute(submissionId: string): Promise<SubmissionResult> {
    // 1. Cargar submission
    const submission = await this.submissionRepository.findById(submissionId);

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // 2. Cargar challenge para usar límites y test cases
    const challenge = await this.challengeRepository.findById(
      submission.challengeId,
    );

    if (!challenge) {
      throw new Error(
        `Challenge ${submission.challengeId} not found for submission ${submissionId}`,
      );
    }

    // 3. Marcar submission como RUNNING
    await this.submissionRepository.update(submission.id, {
      status: SubmissionStatus.RUNNING,
    });

    this.logger.info('Submission set to RUNNING', {
      submissionId,
    });

    try {
      // 4. Ejecutar el código en el runner (usa executeCode de IRunnerService)
      const runnerConfig: RunnerConfig = {
        language: submission.language,
        code: submission.code,
        // si tu entidad Challenge tiene otros nombres, ajusta estos casts
        timeLimit: (challenge as any).timeLimit ?? 2000,
        memoryLimit: (challenge as any).memoryLimit ?? 256,
        testCases: ((challenge as any).testCases ?? []).map((tc: any) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden ?? false,
        })),
      };

      const runnerResult = await this.runnerService.executeCode(runnerConfig);

      // 5. Construir SubmissionResult a partir de RunnerResult
      const submissionResult: SubmissionResult = {
  submissionId: submission.id,
  status: runnerResult.status as SubmissionStatus,
  score: runnerResult.score,
  timeMsTotal: runnerResult.timeMsTotal,
  memoryKbTotal: runnerResult.memoryKbTotal,
  testCaseResults: runnerResult.testCaseResults.map((tc) => ({
    caseId: tc.caseId,
    status: tc.status as SubmissionStatus,
    timeMs: tc.timeMs,
    memoryKb: tc.memoryKb,
    actualOutput: tc.actualOutput,
    expectedOutput: tc.expectedOutput,
    errorMessage: tc.errorMessage,
  })),
  errorMessage: runnerResult.errorMessage,
};


      // 6. Actualizar submission con el resultado final
      await this.submissionRepository.update(submission.id, {
        status: submissionResult.status,
        score: submissionResult.score,
        timeMsTotal: submissionResult.timeMsTotal,
        memoryKbTotal: submissionResult.memoryKbTotal,
        testCaseResults: submissionResult.testCaseResults,
        errorMessage: submissionResult.errorMessage,
      });

      this.logger.info('Submission updated with result', {
        submissionId,
        status: submissionResult.status,
        score: submissionResult.score,
      });

      // 7. Actualizar leaderboards (reto, curso y evaluación si aplica)
      await this.leaderboardRepository.updateChallengeLeaderboard(
        submission.challengeId,
      );
      await this.leaderboardRepository.updateCourseLeaderboard(
        submission.courseId,
      );
      if (submission.evaluationId) {
        await this.leaderboardRepository.updateEvaluationLeaderboard(
          submission.evaluationId,
        );
      }

      this.logger.info('Leaderboards updated for submission', {
        submissionId,
      });

      // 8. Devolver resultado al worker
      return submissionResult;
    } catch (error) {
      // 9. Si algo falla en ejecución, marcar como RUNTIME_ERROR
      await this.submissionRepository.update(submission.id, {
        status: SubmissionStatus.RUNTIME_ERROR,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error('Failed to process submission', {
        submissionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
