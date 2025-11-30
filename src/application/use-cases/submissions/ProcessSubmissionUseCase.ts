// src/application/use-cases/submissions/ProcessSubmissionUseCase.ts
import { ISubmissionRepository } from '../../../domain/repositories/ISubmissionRepository';
import { IChallengeRepository } from '../../../domain/repositories/IChallengeRepository';
// 👇 usamos any para no pelear con la interfaz estricta
// import { ILeaderboardRepository } from '../../../domain/repositories/ILeaderboardRepository';
import {
  SubmissionStatus,
  SubmissionResult,
} from '../../../domain/entities/Submission';
import {
  IRunnerService,
  RunnerConfig,
  RunnerResult,
} from '../../../domain/services/IRunnerService';
import { Logger } from '../../../frameworks/Logger';

export class ProcessSubmissionUseCase {
  private readonly submissionRepo: ISubmissionRepository;
  private readonly challengeRepo: IChallengeRepository;
  // la instancia real es ComputedLeaderboardRepository, pero aquí la tipamos como any
  private readonly leaderboardRepo: any;
  private readonly runnerService: IRunnerService;
  private readonly logger: Logger;

  constructor(
    submissionRepo: ISubmissionRepository,
    runnerService: IRunnerService,
    leaderboardRepo: any,
    challengeRepo: IChallengeRepository,
  ) {
    this.submissionRepo = submissionRepo;
    this.challengeRepo = challengeRepo;
    this.leaderboardRepo = leaderboardRepo;
    this.runnerService = runnerService;
    this.logger = new Logger('ProcessSubmissionUseCase');
  }

  /**
   * Procesa una submission: corre el código contra los test cases y guarda el resultado.
   */
  async execute(submissionId: string): Promise<void> {
    try {
      // 1) Cargar submission
      const submission = await this.submissionRepo.findById(submissionId);
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // 2) Cargar challenge
      const challenge = await this.challengeRepo.findById(submission.challengeId);
      if (!challenge) {
        throw new Error(`Challenge ${submission.challengeId} not found`);
      }

      // 3) Preparar RunnerConfig con test cases visibles
      const visibleTestCases = (challenge.testCases ?? []).filter(
        (tc: any) => !tc.isHidden,
      );

      const runnerConfig: RunnerConfig = {
        language: submission.language,
        code: submission.code,
        timeLimit: challenge.timeLimit,
        memoryLimit: challenge.memoryLimit,
        testCases: visibleTestCases.map((tc: any) => ({
          id: String(tc._id ?? tc.id),
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      };

      // 4) Ejecutar código con el RunnerService
      const result: RunnerResult = await this.runnerService.execute(runnerConfig);

      // 5) Mapear RunnerResult -> SubmissionResult y actualizar submission
      const submissionResult: SubmissionResult = {
        submissionId,
        status: result.status ?? SubmissionStatus.WRONG_ANSWER,
        score: result.score ?? 0,
        timeMsTotal: result.timeMsTotal ?? 0,
        memoryKbTotal: result.memoryKbTotal ?? 0,
        testCaseResults: result.testCaseResults ?? [],
        errorMessage: result.errorMessage,
      };

      submission.status = submissionResult.status;
      submission.score = submissionResult.score;
      submission.timeMsTotal = submissionResult.timeMsTotal;
      submission.memoryKbTotal = submissionResult.memoryKbTotal;
      (submission as any).testCaseResults = submissionResult.testCaseResults;
      submission.errorMessage = submissionResult.errorMessage;

      await this.submissionRepo.update(submissionId, submission);

      // 6) Actualizar leaderboard (best-effort)
      try {
        if (this.leaderboardRepo?.updateWithSubmission) {
          await this.leaderboardRepo.updateWithSubmission(submission, challenge);
        }
      } catch (err) {
        this.logger.error('Error updating leaderboard', {
          submissionId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // marcamos la submission como RUNTIME_ERROR
      await this.submissionRepo.update(submissionId, {
        status: SubmissionStatus.RUNTIME_ERROR,
        errorMessage: msg,
      } as any);

      this.logger.error('Error processing submission', {
        submissionId,
        error: msg,
      });

      throw err;
    }
  }
}
