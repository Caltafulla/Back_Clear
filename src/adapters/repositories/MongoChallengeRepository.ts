import mongoose, { Schema, Document } from 'mongoose';
import { IChallengeRepository } from '../../domain/repositories/IChallengeRepository';
import { 
  Challenge, 
  CreateChallengeRequest, 
  UpdateChallengeRequest, 
  ChallengeStatus,
  ChallengeDifficulty,
  TestCase 
} from '../../domain/entities/Challenge';

interface ITestCaseDocument extends Document {
  challengeId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
  createdAt: Date;
}

interface IChallengeDocument extends Document {
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  status: ChallengeStatus;
  courseId: string;
  createdBy: string;
  testCases: ITestCaseDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCaseDocument>({
  challengeId: { type: String, required: false }, // Will be set after challenge creation
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  order: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ChallengeSchema = new Schema<IChallengeDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: Object.values(ChallengeDifficulty), required: true },
  tags: [{ type: String }],
  timeLimit: { type: Number, required: true },
  memoryLimit: { type: Number, required: true },
  status: { type: String, enum: Object.values(ChallengeStatus), default: ChallengeStatus.DRAFT },
  courseId: { type: String, required: true },
  createdBy: { type: String, required: true },
  testCases: [TestCaseSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChallengeModel = mongoose.model<IChallengeDocument>('Challenge', ChallengeSchema);

export class MongoChallengeRepository implements IChallengeRepository {
  async findById(id: string): Promise<Challenge | null> {
    const challenge = await ChallengeModel.findById(id);
    return challenge ? this.mapToChallenge(challenge) : null;
  }

  async create(challengeData: CreateChallengeRequest, createdBy: string): Promise<Challenge> {
    // Create challenge document first to get the ID
    const challenge = new ChallengeModel({
      ...challengeData,
      createdBy,
      testCases: challengeData.testCases.map(tc => ({
        ...tc,
        challengeId: '', // Temporary, will be updated after save
        createdAt: new Date()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to get the actual ID
    const savedChallenge = await challenge.save();
    const actualChallengeId = (savedChallenge._id as any).toString();
    
    // Update testCases with the actual challengeId
    savedChallenge.testCases.forEach((tc: any) => {
      tc.challengeId = actualChallengeId;
    });
    
    await savedChallenge.save();
    
    return this.mapToChallenge(savedChallenge);
  }

  async update(id: string, challengeData: UpdateChallengeRequest): Promise<Challenge | null> {
    const challenge = await ChallengeModel.findByIdAndUpdate(
      id,
      { ...challengeData, updatedAt: new Date() },
      { new: true }
    );
    
    return challenge ? this.mapToChallenge(challenge) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ChallengeModel.findByIdAndDelete(id);
    return !!result;
  }

  async findByCourseId(courseId: string): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find({ courseId });
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  async findByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find({ status });
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  async findByDifficulty(difficulty: string): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find({ difficulty });
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  async findByTags(tags: string[]): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find({ tags: { $in: tags } });
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find()
      .limit(limit)
      .skip(offset)
      .sort({ createdAt: -1 });
    
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  async search(query: string): Promise<Challenge[]> {
    const challenges = await ChallengeModel.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    });
    
    return challenges.map(challenge => this.mapToChallenge(challenge));
  }

  private mapToChallenge(challengeDoc: IChallengeDocument): Challenge {
    return {
      id: (challengeDoc._id as any).toString(),
      title: challengeDoc.title,
      description: challengeDoc.description,
      difficulty: challengeDoc.difficulty,
      tags: challengeDoc.tags,
      timeLimit: challengeDoc.timeLimit,
      memoryLimit: challengeDoc.memoryLimit,
      status: challengeDoc.status,
      courseId: challengeDoc.courseId,
      createdBy: challengeDoc.createdBy,
      testCases: challengeDoc.testCases.map(tc => ({
        id: (tc._id as any).toString(),
        challengeId: tc.challengeId,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: tc.order,
        createdAt: tc.createdAt
      })),
      createdAt: challengeDoc.createdAt,
      updatedAt: challengeDoc.updatedAt
    };
  }
}

