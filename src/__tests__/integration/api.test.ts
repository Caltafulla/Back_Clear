import request from 'supertest';
import express from 'express';
import { AuthService } from '../../frameworks/AuthService';
import { MockUserRepository } from '../../adapters/repositories/MockUserRepository';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { AuthController } from '../../adapters/controllers/AuthController';
import { createAuthRoutes } from '../../adapters/routes/authRoutes';
import { UserRole } from '../../domain/entities/User';

describe('API Integration Tests', () => {
  let app: express.Application;
  let authService: AuthService;
  let userRepository: MockUserRepository;
  let loginUseCase: LoginUseCase;
  let authController: AuthController;

  beforeAll(async () => {
    // Initialize services
    authService = new AuthService();
    userRepository = new MockUserRepository();
    loginUseCase = new LoginUseCase(userRepository, authService);
    authController = new AuthController(loginUseCase, null as any, authService);

    // Create test user
    await userRepository.create({
      email: 'test@example.com',
      password: await authService.hashPassword('password123'),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.STUDENT
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRoutes(authController));
  });

  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate JWT token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Test protected endpoint (mock)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});