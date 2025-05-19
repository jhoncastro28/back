import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationDto } from '../common/dto';
import '../config/test.envs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ToggleActiveDto } from './dto/toggle-active.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

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

  // Mock user data with 'any' type to avoid type conflicts in tests
  const mockUser: any = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ADMINISTRATOR',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock create user DTO
  const mockCreateUserDto: any = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ADMINISTRATOR',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
  };

  // Mock login DTO
  const mockLoginDto: LoginAuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  // Mock update user DTO
  const mockUpdateUserDto: UpdateAuthDto = {
    email: 'updated@example.com',
    firstName: 'Updated',
  };

  // Mock toggle active DTO
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
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_token');

      const result = await service.signup(mockCreateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.objectContaining({
          expiresIn: '1d',
        }),
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
      // Password should be excluded from the result
      expect(result.user).not.toHaveProperty('password');
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
      jest.spyOn(jwtService, 'sign').mockReturnValue('mocked_token');

      const result = await service.login(mockLoginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.objectContaining({
          expiresIn: '1d',
        }),
      );
      expect(result).toEqual({
        message: 'Login successful',
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        token: 'mocked_token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false for invalid password
      const bcrypt = jest.requireMock('bcrypt');
      bcrypt.compare.mockImplementationOnce(() => false);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-id-2' }];
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue(users as any);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(2);

      const result = await service.findAllUsers(paginationDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        where: {},
      });
      expect(result).toEqual({
        data: users,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'Users retrieved successfully',
      });
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      const result = await service.findUserById('user-id-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        user: mockUser,
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
      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        firstName: 'Updated',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-id-1', mockUpdateUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: expect.objectContaining({
          email: 'updated@example.com',
          firstName: 'Updated',
        }),
      });
      expect(result).toEqual({
        message: 'User updated successfully',
        user: expect.objectContaining({
          email: 'updated@example.com',
          firstName: 'Updated',
        }),
      });
      // Password should be excluded from the result
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user to update not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateUser('non-existent-id', mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should hash password if included in update', async () => {
      const updateWithPassword: UpdateAuthDto = {
        ...mockUpdateUserDto,
        password: 'new_password',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        ...updateWithPassword,
        password: 'hashed_password',
      });

      await service.updateUser('user-id-1', updateWithPassword);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: expect.objectContaining({
          password: 'hashed_password',
        }),
      });
    });
  });

  describe('toggleUserActive', () => {
    it('should deactivate a user successfully', async () => {
      const deactivatedUser = {
        ...mockUser,
        isActive: false,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(deactivatedUser);

      const result = await service.toggleUserActive(
        'user-id-1',
        mockToggleActiveDto,
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          isActive: false,
        },
      });
      expect(result).toEqual({
        message: 'User deactivated successfully',
        user: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('should activate a user successfully', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };

      const activatedUser = {
        ...mockUser,
        isActive: true,
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(inactiveUser);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(activatedUser);

      const result = await service.toggleUserActive('user-id-1', {
        isActive: true,
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          isActive: true,
        },
      });
      expect(result).toEqual({
        message: 'User activated successfully',
        user: expect.objectContaining({
          isActive: true,
        }),
      });
    });

    it('should throw NotFoundException if user to toggle not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.toggleUserActive('non-existent-id', mockToggleActiveDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRole', () => {
    it('should return the user role', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ role: 'ADMINISTRATOR' } as any);

      const result = await service.getUserRole('user-id-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        select: { role: true },
      });
      expect(result).toEqual({ role: 'ADMINISTRATOR' });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getUserRole('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
