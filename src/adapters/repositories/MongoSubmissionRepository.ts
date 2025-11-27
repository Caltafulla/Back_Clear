import mongoose, { Schema, Document } from 'mongoose';
import { ISubmissionRepository } from '../../domain/repositories/ISubmissionRepository';
import { Submission, CreateSubmissionRequest, SubmissionStatus, ProgrammingLanguage, TestCaseResult } from '../../domain/entities/Submission';

interface ISubmissionDocument extends Document {
  userId: string;
  challengeId: string;
  courseId: string;
  language: ProgrammingLanguage;
  code: string;
  status: SubmissionStatus;
  score: number;
  timeMsTotal: number;
  memoryKbTotal: number;
  testCaseResults: TestCaseResult[];
  errorMessage?: string;
  evaluationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseResultSchema = new Schema({
  caseId: String,
  status: String,
  timeMs: Number,
  memoryKb: Number,
  actualOutput: Schema.Types.Mixed,
  expectedOutput: Schema.Types.Mixed,
  errorMessage: String
}, { _id: false });

const SubmissionSchema = new Schema<ISubmissionDocument>({
  userId: { type: String, required: true },
  challengeId: { type: String, required: true },
  courseId: { type: String, required: true },
  language: { type: String, enum: Object.values(ProgrammingLanguage), required: true },
  code: { type: String, required: true },
  status: { type: String, enum: Object.values(SubmissionStatus), required: true, default: SubmissionStatus.QUEUED },
  score: { type: Number, default: 0 },
  timeMsTotal: { type: Number, default: 0 },
  memoryKbTotal: { type: Number, default: 0 },
  testCaseResults: { type: [TestCaseResultSchema], default: [] },
  errorMessage: { type: String },
  evaluationId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export class MongoSubmissionRepository implements ISubmissionRepository {
  private model: any = SubmissionModel;

  private map(doc: ISubmissionDocument): Submission {
    return {
      id: (doc._id as any).toString(),
      userId: doc.userId,
      challengeId: doc.challengeId,
      courseId: doc.courseId,
      language: doc.language,
      code: doc.code,
      status: doc.status,
      score: doc.score,
      timeMsTotal: doc.timeMsTotal,
      memoryKbTotal: doc.memoryKbTotal,
      testCaseResults: doc.testCaseResults || [],
      errorMessage: doc.errorMessage,
      evaluationId: doc.evaluationId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    } as Submission;
  }

  async findById(id: string): Promise<Submission | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async create(submissionData: CreateSubmissionRequest & { userId: string }): Promise<Submission> {
    const toCreate = {
      ...submissionData,
      status: SubmissionStatus.QUEUED,
      score: 0,
      timeMsTotal: 0,
      memoryKbTotal: 0,
      testCaseResults: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    const doc = new this.model(toCreate);
    const saved = await doc.save();
    return this.map(saved as ISubmissionDocument);
  }

  async update(id: string, updates: Partial<Submission>): Promise<Submission | null> {
    const updated = await this.model.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).exec();
    return updated ? this.map(updated as ISubmissionDocument) : null;
  }

  async findByUserId(userId: string): Promise<Submission[]> {
    const docs = await this.model.find({ userId }).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async findByChallengeId(challengeId: string): Promise<Submission[]> {
    const docs = await this.model.find({ challengeId }).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async findByCourseId(courseId: string): Promise<Submission[]> {
    const docs = await this.model.find({ courseId }).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async findByStatus(status: SubmissionStatus): Promise<Submission[]> {
    const docs = await this.model.find({ status }).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async findByLanguage(language: ProgrammingLanguage): Promise<Submission[]> {
    const docs = await this.model.find({ language }).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async findBestSubmissionByUserAndChallenge(userId: string, challengeId: string): Promise<Submission | null> {
    const docs = await this.model.find({ userId, challengeId }).exec();
    if (!docs || docs.length === 0) return null;

    const best = docs.reduce((bestDoc: any, current: any) => {
      const bestScore = bestDoc.score || 0;
      const currScore = current.score || 0;
      if (currScore > bestScore) return current;
      if (currScore === bestScore && (current.timeMsTotal || 0) < (bestDoc.timeMsTotal || 0)) return current;
      return bestDoc;
    });

    return this.map(best as ISubmissionDocument);
  }

  async findRecentSubmissions(limit: number = 50, offset: number = 0): Promise<Submission[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
    return docs.map((d: any) => this.map(d as ISubmissionDocument));
  }

  async getSubmissionStats(userId?: string, challengeId?: string): Promise<{
    total: number;
    accepted: number;
    failed: number;
    averageTime: number;
  }> {
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (challengeId) filter.challengeId = challengeId;

    const docs = await this.model.find(filter).exec();
    const total = docs.length;
    const accepted = docs.filter((d: any) => d.status === SubmissionStatus.ACCEPTED).length;
    const failed = docs.filter((d: any) => d.status !== SubmissionStatus.ACCEPTED).length;
    const averageTime = total > 0 ? docs.reduce((sum: number, d: any) => sum + (d.timeMsTotal || 0), 0) / total : 0;

    return { total, accepted, failed, averageTime };
  }
}
