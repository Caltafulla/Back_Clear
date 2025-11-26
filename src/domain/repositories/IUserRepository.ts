import { User, CreateUserRequest, UpdateUserRequest } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserRequest): Promise<User>;
  update(id: string, userData: UpdateUserRequest): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
  findByRole(role: string): Promise<User[]>;
}

