import { User, LoginRequest, AuthResponse } from '../entities/User';

export interface IAuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthResponse>;
  validateToken(token: string): Promise<User | null>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  generateToken(user: User): string;
  verifyToken(token: string): { userId: string; role: string } | null;
}

