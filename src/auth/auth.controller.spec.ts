import { Test, TestingModule } from '@nestjs/testing';
import { PaginationDto } from '../common/dto';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import '../config/test.envs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  LoginAuthDto,
  ToggleActiveDto,
  UpdateAuthDto,
} from './dto';

describe('AuthController', () => {
  let module: TestingModule;
  let controller: AuthController;
  let authService: AuthService;
  let toggleActiveService: ToggleActiveService;

  // Mock responses
  const mockAuthResponse = {
    message: 'User registered successfully',
    user: {
      id: 'user-id-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMINISTRATOR',
      isActive: true,
    },
    token: 'jwt_token',
  };

  const mockPaginatedUsers = {
    data: [
      {
        id: 'user-id-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Users retrieved successfully',
  };

  const mockUserResponse = {
    user: {
      id: 'user-id-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMINISTRATOR',
      isActive: true,
    },
    message: 'User found successfully',
  };

  const mockUpdatedUserResponse = {
    user: {
      id: 'user-id-1',
      email: 'updated@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMINISTRATOR',
      isActive: true,
    },
    message: 'User updated successfully',
  };

  const mockDeactivatedUserResponse = {
    user: {
      id: 'user-id-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMINISTRATOR',
      isActive: false,
    },
    message: 'User deactivated successfully',
  };

  // Mock DTOs
  const mockCreateUserDto: CreateAuthDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockLoginDto: LoginAuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockPaginationDto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  const mockUpdateUserDto: UpdateAuthDto = {
    email: 'updated@example.com',
  };

  const mockToggleActiveDto: ToggleActiveDto = {
    isActive: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            findAllUsers: jest.fn().mockResolvedValue(mockPaginatedUsers),
            findUserById: jest.fn().mockResolvedValue(mockUserResponse),
            getUserRole: jest.fn().mockResolvedValue({ role: 'ADMINISTRATOR' }),
            updateUser: jest.fn().mockResolvedValue(mockUpdatedUserResponse),
            toggleUserActive: jest
              .fn()
              .mockResolvedValue(mockDeactivatedUserResponse),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest
              .fn()
              .mockResolvedValue(mockDeactivatedUserResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should register a new user', async () => {
      const result = await controller.signup(mockCreateUserDto);
      expect(authService.signup).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const result = await controller.login(mockLoginDto);
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const result = await controller.findAllUsers(mockPaginationDto);
      expect(authService.findAllUsers).toHaveBeenCalledWith(mockPaginationDto);
      expect(result).toEqual(mockPaginatedUsers);
    });
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const result = await controller.findUserById('user-id-1');
      expect(authService.findUserById).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const mockRequest = { user: { id: 'user-id-1' } };
      const result = await controller.getUserRole(mockRequest);
      expect(authService.getUserRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual({ role: 'ADMINISTRATOR' });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const result = await controller.updateUser(
        'user-id-1',
        mockUpdateUserDto,
      );
      expect(authService.updateUser).toHaveBeenCalledWith(
        'user-id-1',
        mockUpdateUserDto,
      );
      expect(result).toEqual(mockUpdatedUserResponse);
    });
  });

  describe('toggleUserActive', () => {
    it('should activate/deactivate a user', async () => {
      const result = await controller.deactivateUser('user-id-1');
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'user',
        'user-id-1',
        mockToggleActiveDto,
      );
      expect(result).toEqual(mockDeactivatedUserResponse);
    });
  });

  describe('adminOnly', () => {
    it('should return success message for admin access', () => {
      const mockRequest = { user: { id: 'user-id-1', role: 'ADMINISTRATOR' } };
      const result = controller.adminOnly(mockRequest);
      expect(result).toEqual({
        message: 'Admin access successful',
        user: mockRequest.user,
      });
    });
  });
});
