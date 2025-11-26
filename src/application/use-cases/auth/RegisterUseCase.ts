import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IAuthService } from '../../../domain/services/IAuthService';
import { CreateUserRequest, AuthResponse, UserRole } from '../../../domain/entities/User';

export class RegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(request: CreateUserRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(request.password);

    // Create user
    const userData: CreateUserRequest = {
      ...request,
      password: hashedPassword,
      role: request.role || UserRole.STUDENT
    };

    const user = await this.userRepository.create(userData);

    // Generate token
    const token = this.authService.generateToken(user);
    
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }
}

