import { ILeaderboardRepository, LeaderboardOptions } from '../../domain/repositories/ILeaderboardRepository';
import { LeaderboardEntry, ChallengeLeaderboard, CourseLeaderboard, EvaluationLeaderboard } from '../../domain/entities/Leaderboard';
import { ISubmissionRepository } from '../../domain/repositories/ISubmissionRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { Submission, SubmissionStatus } from '../../domain/entities/Submission';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { Evaluation } from '../../domain/entities/Evaluation';

export class ComputedLeaderboardRepository implements ILeaderboardRepository {
  private challengeCache: Map<string, ChallengeLeaderboard> = new Map();
  private courseCache: Map<string, CourseLeaderboard> = new Map();
  private evaluationCache: Map<string, EvaluationLeaderboard> = new Map();

  constructor(
    private submissionRepo: ISubmissionRepository,
    private userRepo: IUserRepository,
    private evaluationRepo?: IEvaluationRepository
  ) {}

  // Generate cache key that includes filters
  private getCacheKey(id: string, options?: LeaderboardOptions): string {
    if (!options) return id;
    const parts = [id];
    if (options.language) parts.push(`lang:${options.language}`);
    if (options.from) parts.push(`from:${options.from.getTime()}`);
    if (options.to) parts.push(`to:${options.to.getTime()}`);
    if (options.includeEvaluationSubmissions) parts.push('eval:true');
    return parts.join('|');
  }

  // Compute challenge leaderboard on demand
  async getChallengeLeaderboard(challengeId: string, limit: number = 50, options?: LeaderboardOptions): Promise<ChallengeLeaderboard> {
    // If present in cache, return
    const cacheKey = this.getCacheKey(challengeId, options);
    const cached = this.challengeCache.get(cacheKey);
    if (cached) return { ...cached };

    // Build leaderboard
    let submissions = await this.submissionRepo.findByChallengeId(challengeId);

    // Apply filters
    if (options?.language) {
      submissions = submissions.filter(s => s.language === options.language);
    }
    // Exclude evaluation submissions by default
    if (!options?.includeEvaluationSubmissions) {
      submissions = submissions.filter(s => !s.evaluationId);
    }
    if (options?.from) {
      submissions = submissions.filter(s => s.createdAt >= options.from!);
    }
    if (options?.to) {
      submissions = submissions.filter(s => s.createdAt <= options.to!);
    }

    // Group best submission per user
    const bestByUser = new Map<string, Submission>();
    for (const s of submissions) {
      const cur = bestByUser.get(s.userId);
      if (!cur) {
        bestByUser.set(s.userId, s);
        continue;
      }
      // Compare by score desc, time asc, createdAt asc
      if (s.score > cur.score) bestByUser.set(s.userId, s);
      else if (s.score === cur.score && s.timeMsTotal < cur.timeMsTotal) bestByUser.set(s.userId, s);
      else if (s.score === cur.score && s.timeMsTotal === cur.timeMsTotal && s.createdAt < cur.createdAt) bestByUser.set(s.userId, s);
    }

    const entries: LeaderboardEntry[] = [];
    for (const [userId, submission] of bestByUser.entries()) {
      const user = await this.userRepo.findById(userId);
      entries.push({
        userId,
        firstName: user ? user.firstName : 'Unknown',
        lastName: user ? user.lastName : '',
        score: submission.score,
        totalSubmissions: 1,
        acceptedSubmissions: submission.status === SubmissionStatus.ACCEPTED ? 1 : 0,
        averageTimeMs: submission.timeMsTotal,
        rank: 0,
        firstSolvedAt: submission.createdAt
      });
    }

    // Sort
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.averageTimeMs !== b.averageTimeMs) return a.averageTimeMs - b.averageTimeMs;
      // Tie-breaker by earliest submission date
      const aDate = a.firstSolvedAt ? new Date(a.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.firstSolvedAt ? new Date(b.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    // Assign ranks and limit
    for (let i = 0; i < entries.length; i++) (entries[i]!).rank = i + 1;
    const result: ChallengeLeaderboard = {
      challengeId,
      entries: entries.slice(0, limit),
      totalParticipants: entries.length,
      lastUpdated: new Date()
    };

    this.challengeCache.set(cacheKey, result);
    return { ...result };
  }

  // Compute course leaderboard by summing best submissions per challenge
  async getCourseLeaderboard(courseId: string, limit: number = 50, options?: LeaderboardOptions): Promise<CourseLeaderboard> {
    const cacheKey = this.getCacheKey(courseId, options);
    const cached = this.courseCache.get(cacheKey);
    if (cached) return { ...cached };

    let submissions = await this.submissionRepo.findByCourseId(courseId);

    // Apply filters
    if (options?.language) {
      submissions = submissions.filter(s => s.language === options.language);
    }
    if (!options?.includeEvaluationSubmissions) {
      submissions = submissions.filter(s => !s.evaluationId);
    }
    if (options?.from) {
      submissions = submissions.filter(s => s.createdAt >= options.from!);
    }
    if (options?.to) {
      submissions = submissions.filter(s => s.createdAt <= options.to!);
    }

    // Map of user -> challenge -> best submission
    const bestMap: Map<string, Map<string, Submission>> = new Map();
    for (const s of submissions) {
      let byChallenge = bestMap.get(s.userId);
      if (!byChallenge) {
        byChallenge = new Map();
        bestMap.set(s.userId, byChallenge);
      }
      const cur = byChallenge.get(s.challengeId);
      if (!cur) {
        byChallenge.set(s.challengeId, s);
        continue;
      }
      if (s.score > cur.score) byChallenge.set(s.challengeId, s);
      else if (s.score === cur.score && s.timeMsTotal < cur.timeMsTotal) byChallenge.set(s.challengeId, s);
      else if (s.score === cur.score && s.timeMsTotal === cur.timeMsTotal && s.createdAt < cur.createdAt) byChallenge.set(s.challengeId, s);
    }

    const entries: LeaderboardEntry[] = [];
    for (const [userId, byChallenge] of bestMap.entries()) {
      let totalScore = 0;
      let totalTime = 0;
      let accepted = 0;
      let totalSubs = 0;
      let earliest: Date | null = null;
      for (const s of Array.from(byChallenge.values())) {
        totalScore += s.score;
        totalTime += s.timeMsTotal;
        accepted += s.status === SubmissionStatus.ACCEPTED ? 1 : 0;
        totalSubs += 1;
        if (!earliest || s.createdAt < earliest) earliest = s.createdAt;
      }

      const user = await this.userRepo.findById(userId);
      entries.push({
        userId,
        firstName: user ? user.firstName : 'Unknown',
        lastName: user ? user.lastName : '',
        score: totalScore,
        totalSubmissions: totalSubs,
        acceptedSubmissions: accepted,
        averageTimeMs: totalTime,
        rank: 0,
        firstSolvedAt: earliest || undefined
      });
    }

    // Sort by score desc, total time asc
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.averageTimeMs !== b.averageTimeMs) return a.averageTimeMs - b.averageTimeMs;
      const aDate = a.firstSolvedAt ? new Date(a.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.firstSolvedAt ? new Date(b.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    for (let i = 0; i < entries.length; i++) (entries[i]!).rank = i + 1;

    const result: CourseLeaderboard = {
      courseId,
      entries: entries.slice(0, limit),
      totalParticipants: entries.length,
      lastUpdated: new Date()
    };

    this.courseCache.set(cacheKey, result);
    return { ...result };
  }

  async getEvaluationLeaderboard(evaluationId: string, limit: number = 50, options?: LeaderboardOptions) {
    const cacheKey = this.getCacheKey(evaluationId, options);
    const cached = this.evaluationCache.get(cacheKey);
    if (cached) return { ...cached };

    if (!this.evaluationRepo) {
      return {
        evaluationId,
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date()
      };
    }

    const evaluation: Evaluation | null = await this.evaluationRepo.findById(evaluationId);
    if (!evaluation) {
      return {
        evaluationId,
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date()
      };
    }

    // For each challenge in the evaluation, collect submissions in the evaluation time window
    const start = evaluation.startDate ? new Date(evaluation.startDate) : null;
    const end = evaluation.endDate ? new Date(evaluation.endDate) : null;

    // Map user -> aggregated best per challenge
    const userAggregates: Map<string, { totalScore: number; totalTime: number; accepted: number; totalChallenges: number }>
      = new Map();

    for (const challengeId of evaluation.challengeIds) {
      let subs = await this.submissionRepo.findByChallengeId(challengeId);
      if (options?.language) {
        subs = subs.filter(s => s.language === options.language);
      }
      // Filter by evaluation window if present
      const filtered = subs.filter(s => {
        if (start && s.createdAt < start) return false;
        if (end && s.createdAt > end) return false;
        return true;
      });

      // Find best per user for this challenge
      const bestByUser = new Map<string, Submission>();
      for (const s of filtered) {
        const cur = bestByUser.get(s.userId);
        if (!cur) { bestByUser.set(s.userId, s); continue; }
        if (s.score > cur.score) bestByUser.set(s.userId, s);
        else if (s.score === cur.score && s.timeMsTotal < cur.timeMsTotal) bestByUser.set(s.userId, s);
        else if (s.score === cur.score && s.timeMsTotal === cur.timeMsTotal && s.createdAt < cur.createdAt) bestByUser.set(s.userId, s);
      }

      for (const [userId, best] of bestByUser.entries()) {
        const agg = userAggregates.get(userId) || { totalScore: 0, totalTime: 0, accepted: 0, totalChallenges: 0 };
        agg.totalScore += best.score;
        agg.totalTime += best.timeMsTotal;
        agg.accepted += best.status === SubmissionStatus.ACCEPTED ? 1 : 0;
        agg.totalChallenges += 1;
        userAggregates.set(userId, agg);
      }
    }

    const entries: LeaderboardEntry[] = [];
    for (const [userId, agg] of userAggregates.entries()) {
      const user = await this.userRepo.findById(userId);
      entries.push({
        userId,
        firstName: user ? user.firstName : 'Unknown',
        lastName: user ? user.lastName : '',
        score: agg.totalScore,
        totalSubmissions: agg.totalChallenges,
        acceptedSubmissions: agg.accepted,
        averageTimeMs: agg.totalTime,
        rank: 0,
        // For evaluations, use window start as tie-breaker proxy if available
        firstSolvedAt: start || undefined
      });
    }

    // Sort by score desc, time asc
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.averageTimeMs !== b.averageTimeMs) return a.averageTimeMs - b.averageTimeMs;
      const aDate = a.firstSolvedAt ? new Date(a.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.firstSolvedAt ? new Date(b.firstSolvedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    for (let i = 0; i < entries.length; i++) entries[i]!.rank = i + 1;

    const result: EvaluationLeaderboard = {
      evaluationId,
      entries: entries.slice(0, limit),
      totalParticipants: entries.length,
      lastUpdated: new Date()
    };

    this.evaluationCache.set(cacheKey, result);
    return { ...result };
  }

  // Invalidate all cache entries for a given entity (including all filter variations)
  private invalidateCache(cache: Map<string, any>, entityId: string): void {
    const keysToDelete: string[] = [];
    for (const key of cache.keys()) {
      if (key === entityId || key.startsWith(`${entityId}|`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
  }

  async updateChallengeLeaderboard(challengeId: string): Promise<void> {
    // Invalidate all cached variations for this challenge
    this.invalidateCache(this.challengeCache, challengeId);
  }

  async updateCourseLeaderboard(courseId: string): Promise<void> {
    // Invalidate all cached variations for this course
    this.invalidateCache(this.courseCache, courseId);
  }

  async updateEvaluationLeaderboard(evaluationId: string): Promise<void> {
    // Invalidate all cached variations for this evaluation
    this.invalidateCache(this.evaluationCache, evaluationId);
  }

  async getUserRank(userId: string, type: string, entityId: string): Promise<number> {
    if (type === 'challenge') {
      const lb = await this.getChallengeLeaderboard(entityId);
      const entry = lb.entries.find(e => e.userId === userId);
      return entry ? entry.rank : -1;
    }
    if (type === 'course') {
      const lb = await this.getCourseLeaderboard(entityId);
      const entry = lb.entries.find(e => e.userId === userId);
      return entry ? entry.rank : -1;
    }
    return -1;
  }

  async getTopPerformers(type: string, entityId: string, limit: number = 50) {
    if (type === 'challenge') {
      const lb = await this.getChallengeLeaderboard(entityId, limit);
      return lb.entries.slice(0, limit);
    }
    if (type === 'course') {
      const lb = await this.getCourseLeaderboard(entityId, limit);
      return lb.entries.slice(0, limit);
    }
    return [];
  }
}
