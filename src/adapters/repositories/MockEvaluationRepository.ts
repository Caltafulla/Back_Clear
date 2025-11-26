import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { Evaluation, CreateEvaluationRequest, UpdateEvaluationRequest, EvaluationStatus } from '../../domain/entities/Evaluation';

export class MockEvaluationRepository implements IEvaluationRepository {
  private evaluations: Evaluation[] = [];

  async findById(id: string): Promise<Evaluation | null> {
    return this.evaluations.find(e => e.id === id) || null;
  }

  async create(evaluationData: CreateEvaluationRequest, createdBy: string): Promise<Evaluation> {
    const evaluation: Evaluation = {
      id: `eval-${Date.now()}`,
      ...evaluationData,
      status: EvaluationStatus.DRAFT,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.evaluations.push(evaluation);
    return evaluation;
  }

  async update(id: string, evaluationData: UpdateEvaluationRequest): Promise<Evaluation | null> {
    const index = this.evaluations.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    const updatedEvaluation = {
      ...this.evaluations[index],
      ...evaluationData,
      updatedAt: new Date()
    } as Evaluation;
    this.evaluations[index] = updatedEvaluation;
    return updatedEvaluation;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.evaluations.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.evaluations.splice(index, 1);
    return true;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Evaluation[]> {
    return this.evaluations.slice(offset, offset + limit);
  }

  async findByCourseId(courseId: string): Promise<Evaluation[]> {
    return this.evaluations.filter(e => e.courseId === courseId);
  }

  async findByStatus(status: EvaluationStatus): Promise<Evaluation[]> {
    return this.evaluations.filter(e => e.status === status);
  }

  async findByCreator(createdBy: string): Promise<Evaluation[]> {
    return this.evaluations.filter(e => e.createdBy === createdBy);
  }
}

