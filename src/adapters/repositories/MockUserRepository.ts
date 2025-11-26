import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, CreateUserRequest, UpdateUserRequest, LoginRequest } from '../../domain/entities/User';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      ...userData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, userData: UpdateUserRequest): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    const updatedUser = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    } as User;
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    return this.users.slice(offset, offset + limit);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.users.filter(u => u.isActive);
  }

  async validateCredentials(credentials: LoginRequest): Promise<User | null> {
    const user = this.users.find(u => u.email === credentials.email);
    if (!user || !user.isActive) return null;
    return user;
  }
}
