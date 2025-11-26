import { Evaluation, CreateEvaluationRequest, UpdateEvaluationRequest, EvaluationStatus } from '../entities/Evaluation';

export interface IEvaluationRepository {
  findById(id: string): Promise<Evaluation | null>;
  create(evaluationData: CreateEvaluationRequest, createdBy: string): Promise<Evaluation>;
  update(id: string, evaluationData: UpdateEvaluationRequest): Promise<Evaluation | null>;
  delete(id: string): Promise<boolean>;
  findAll(limit?: number, offset?: number): Promise<Evaluation[]>;
  findByCourseId(courseId: string): Promise<Evaluation[]>;
  findByStatus(status: EvaluationStatus): Promise<Evaluation[]>;
  findByCreator(createdBy: string): Promise<Evaluation[]>;
}

