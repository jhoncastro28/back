import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma';
import { PaginationService } from '../common/services/pagination.service';
import '../config/test.envs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ToggleActiveDto } from './dto/toggle-active.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { SessionService } from './services/session.service';

// Mock implementation of bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'hashed_password'),
  compare: jest.fn(() => true),
}));

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let sessionService: SessionService;
  let paginationService: PaginationService;

  // Mock user data
  const mockUser = {
    id: 'user-id-1',
    email: 'john@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
    role: Role.ADMINISTRATOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock DTOs
  const mockCreateUserDto: CreateAuthDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.ADMINISTRATOR,
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
  };

  const mockLoginDto: LoginAuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockUpdateUserDto: UpdateAuthDto = {
    email: 'updated@example.com',
    firstName: 'Updated',
    lastName: 'User',
    phoneNumber: '+1 555-987-6543',
    address: '456 Updated St',
  };

  const mockToggleActiveDto: ToggleActiveDto = {
    isActive: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mocked_token'),
            verify: jest.fn(() => ({ sub: 'user-id-1' })),
            decode: jest.fn(() => ({ sub: 'user-id-1' })),
          },
        },
        {
          provide: SessionService,
          useValue: {
            trackSession: jest.fn(),
            invalidateSession: jest.fn(),
            invalidateAllUserSessions: jest.fn(),
            isSessionActive: jest.fn(),
            cleanupExpiredSessions: jest.fn(),
          },
        },
        {
          provide: PaginationService,
          useValue: {
            getPaginationSkip: jest.fn().mockReturnValue(0),
            createPaginationObject: jest
              .fn()
              .mockImplementation((data, total, page, limit) => ({
                data,
                meta: {
                  total,
                  page,
                  limit,
                  totalPages: Math.ceil(total / limit),
                  hasNextPage: page * limit < total,
                  hasPreviousPage: page > 1,
                },
              })),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    sessionService = module.get<SessionService>(SessionService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(sessionService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user with all fields', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

      const result = await service.signup(mockCreateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(sessionService.trackSession).toHaveBeenCalledWith(
        mockUser.id,
        'mocked_token',
      );
      expect(result).toEqual({
        message: 'User registered successfully',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
        }),
        token: 'mocked_token',
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should create a new user without optional fields', async () => {
      const basicUserDto = {
        email: 'basic@example.com',
        password: 'password123',
        firstName: 'Basic',
        lastName: 'User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        ...basicUserDto,
        role: Role.SALESPERSON,
      });

      await service.signup(basicUserDto);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...basicUserDto,
          password: 'hashed_password',
        }),
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      await expect(service.signup(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.login(mockLoginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(sessionService.trackSession).toHaveBeenCalledWith(
        mockUser.id,
        'mocked_token',
      );
      expect(result).toEqual({
        message: 'Login successful',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        token: 'mocked_token',
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      const bcrypt = jest.requireMock('bcrypt');
      bcrypt.compare.mockImplementationOnce(() => false);
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout a user with specific token', async () => {
      const result = await service.logout(mockUser.id, 'token-123');
      expect(sessionService.invalidateSession).toHaveBeenCalledWith(
        mockUser.id,
        'token-123',
      );
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should logout a user from all sessions', async () => {
      const result = await service.logout(mockUser.id);
      expect(sessionService.invalidateAllUserSessions).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should handle logout errors gracefully', async () => {
      jest
        .spyOn(sessionService, 'invalidateSession')
        .mockRejectedValue(new Error('Session error'));
      await expect(service.logout(mockUser.id, 'token-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logoutWithToken', () => {
    it('should invalidate a specific token', async () => {
      const result = await service.logoutWithToken('valid-token');
      expect(sessionService.invalidateSession).toHaveBeenCalledWith(
        'user-id-1',
        'valid-token',
      );
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should handle invalid token gracefully', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const result = await service.logoutWithToken('invalid-token');
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('isTokenInvalidated', () => {
    it('should return true for invalid token format', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);
      expect(service.isTokenInvalidated('invalid-token')).toBe(true);
    });

    it('should return true for missing token', () => {
      expect(service.isTokenInvalidated('')).toBe(true);
    });

    it('should check session status for valid token', () => {
      jest.spyOn(sessionService, 'isSessionActive').mockReturnValue(true);
      expect(service.isTokenInvalidated('valid-token')).toBe(false);
    });
  });

  describe('findAllUsers', () => {
    const mockUsers = [mockUser];
    const mockFilters = {
      page: 1,
      limit: 10,
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      role: Role.ADMINISTRATOR,
      isActive: true,
    };

    it('should return paginated users with filters', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(1);

      const result = await service.findAllUsers(mockFilters);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          skip: 0,
          take: 10,
        }),
      );
      expect(result.data).toEqual(mockUsers);
      expect(result.meta.total).toBe(1);
    });

    it('should return paginated users without filters', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(1);

      const result = await service.findAllUsers();

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 10,
        }),
      );
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const mockUserData = {
        id: mockUser.id,
        email: mockUser.email,
        password: mockUser.password,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        phoneNumber: mockUser.phoneNumber,
        address: mockUser.address,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUserData);

      const result = await service.findUserById(mockUser.id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          address: true,
          role: true,
          isActive: true,
          password: false,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        user: mockUserData,
        message: 'User found successfully',
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.findUserById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, mockUpdateUserDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: mockUpdateUserDto,
      });
      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUpdateUserDto.email,
        }),
      );
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.updateUser('non-existent-id', mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status', async () => {
      const updatedUser = { ...mockUser, isActive: false };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.toggleUserActive(
        mockUser.id,
        mockToggleActiveDto,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isActive: mockToggleActiveDto.isActive },
      });
      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          isActive: false,
        }),
      );
      expect(result.message).toBe('User deactivated successfully');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.toggleUserActive('non-existent-id', mockToggleActiveDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.getUserRole(mockUser.id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { role: true },
      });
      expect(result).toBe(Role.ADMINISTRATOR);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(service.getUserRole('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
