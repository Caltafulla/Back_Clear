import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { IAuthService } from '../domain/services/IAuthService';
import { User, LoginRequest, AuthResponse } from '../domain/entities/User';

export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    throw new Error('Method not implemented. Use LoginUseCase instead.');
  }

  async register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthResponse> {
    throw new Error('Method not implemented. Use RegisterUseCase instead.');
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        id: decoded.userId,
        email: decoded.email,
        password: '',
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        isActive: decoded.isActive,
        createdAt: new Date(decoded.createdAt),
        updatedAt: new Date(decoded.updatedAt)
      };
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as jwt.SignOptions);
  }

  verifyToken(token: string): { userId: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        userId: decoded.userId,
        role: decoded.role
      };
    } catch (error) {
      return null;
    }
  }
}

