// Simple test to verify the project structure and basic functionality
import { AuthService } from '../frameworks/AuthService';
import { MockUserRepository } from '../adapters/repositories/MockUserRepository';
import { LoginUseCase } from '../application/use-cases/auth/LoginUseCase';
import { UserRole } from '../domain/entities/User';

describe('Project Structure Test', () => {
  let authService: AuthService;
  let userRepository: MockUserRepository;
  let loginUseCase: LoginUseCase;

  beforeAll(() => {
    authService = new AuthService();
    userRepository = new MockUserRepository();
    loginUseCase = new LoginUseCase(userRepository, authService);
  });

  it('should have all required services initialized', () => {
    expect(authService).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(loginUseCase).toBeDefined();
  });

  it('should be able to hash passwords', async () => {
    const password = 'test123';
    const hashed = await authService.hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(20);
  });

  it('should be able to compare passwords', async () => {
    const password = 'test123';
    const hashed = await authService.hashPassword(password);
    
    const isValid = await authService.comparePassword(password, hashed);
    expect(isValid).toBe(true);
    
    const isInvalid = await authService.comparePassword('wrong', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should be able to generate and verify JWT tokens', () => {
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      password: 'hashed',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.STUDENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const token = authService.generateToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = authService.verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.userId).toBe(mockUser.id);
    expect(decoded?.role).toBe(mockUser.role);
  });
});
