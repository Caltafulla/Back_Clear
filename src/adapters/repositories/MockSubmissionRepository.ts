import { ISubmissionRepository } from '../../domain/repositories/ISubmissionRepository';
import { Submission, CreateSubmissionRequest, SubmissionStatus, ProgrammingLanguage } from '../../domain/entities/Submission';

export class MockSubmissionRepository implements ISubmissionRepository {
  private submissions: Submission[] = [];

  async findById(id: string): Promise<Submission | null> {
    return this.submissions.find(s => s.id === id) || null;
  }

  async create(submissionData: CreateSubmissionRequest & { userId: string }): Promise<Submission> {
    const submission: Submission = {
      id: `subm-${Date.now()}`,
      ...submissionData,
      status: SubmissionStatus.QUEUED,
      score: 0,
      timeMsTotal: 0,
      memoryKbTotal: 0,
      testCaseResults: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.submissions.push(submission);
    return submission;
  }

  async update(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    const index = this.submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    const updatedSubmission = {
      ...this.submissions[index],
      ...updates,
      updatedAt: new Date()
    } as Submission;
    this.submissions[index] = updatedSubmission;
    return updatedSubmission;
  }

  async findByUserId(userId: string): Promise<Submission[]> {
    return this.submissions.filter(s => s.userId === userId);
  }

  async findByChallengeId(challengeId: string): Promise<Submission[]> {
    return this.submissions.filter(s => s.challengeId === challengeId);
  }

  async findByCourseId(courseId: string): Promise<Submission[]> {
    return this.submissions.filter(s => s.courseId === courseId);
  }

  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    return this.submissions.filter(s => s.status === status);
  }

  async findByLanguage(language: ProgrammingLanguage): Promise<Submission[]> {
    return this.submissions.filter(s => s.language === language);
  }

  async findBestSubmissionByUserAndChallenge(userId: string, challengeId: string): Promise<Submission | null> {
    const userSubmissions = this.submissions.filter(s => s.userId === userId && s.challengeId === challengeId);
    if (userSubmissions.length === 0) return null;
    
    return userSubmissions.reduce((best, current) => {
      if (current.score > best.score) return current;
      if (current.score === best.score && current.timeMsTotal < best.timeMsTotal) return current;
      return best;
    });
  }

  async findRecentSubmissions(limit: number = 50, offset: number = 0): Promise<Submission[]> {
    return this.submissions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getSubmissionStats(userId?: string, challengeId?: string): Promise<{
    total: number;
    accepted: number;
    failed: number;
    averageTime: number;
  }> {
    let filteredSubmissions = this.submissions;
    
    if (userId) {
      filteredSubmissions = filteredSubmissions.filter(s => s.userId === userId);
    }
    
    if (challengeId) {
      filteredSubmissions = filteredSubmissions.filter(s => s.challengeId === challengeId);
    }
    
    const total = filteredSubmissions.length;
    const accepted = filteredSubmissions.filter(s => s.status === SubmissionStatus.ACCEPTED).length;
    const failed = filteredSubmissions.filter(s => s.status !== SubmissionStatus.ACCEPTED).length;
    const averageTime = total > 0 ? filteredSubmissions.reduce((sum, s) => sum + s.timeMsTotal, 0) / total : 0;
    
    return { total, accepted, failed, averageTime };
  }
}
