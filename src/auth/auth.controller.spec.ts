import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import '../config/test.envs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  FilterUserDto,
  LoginAuthDto,
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
      role: Role.ADMINISTRATOR,
      isActive: true,
      phoneNumber: '+1234567890',
      address: '123 Test St',
      createdAt: new Date(),
      updatedAt: new Date(),
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
        role: Role.ADMINISTRATOR,
        isActive: true,
        phoneNumber: '+1234567890',
        address: '123 Test St',
        createdAt: new Date(),
        updatedAt: new Date(),
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
      role: Role.ADMINISTRATOR,
      isActive: true,
      phoneNumber: '+1234567890',
      address: '123 Test St',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'User found successfully',
  };

  const mockUpdatedUserResponse = {
    user: {
      id: 'user-id-1',
      email: 'updated@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.ADMINISTRATOR,
      isActive: true,
      phoneNumber: '+1234567890',
      address: '123 Test St',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'User updated successfully',
  };

  const mockDeactivatedUserResponse = {
    user: {
      id: 'user-id-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.ADMINISTRATOR,
      isActive: false,
      phoneNumber: '+1234567890',
      address: '123 Test St',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'User deactivated successfully',
  };

  // Mock DTOs
  const mockCreateUserDto: CreateAuthDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.ADMINISTRATOR,
    phoneNumber: '+1234567890',
    address: '123 Test St',
  };

  const mockLoginDto: LoginAuthDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockFilterUserDto: FilterUserDto = {
    page: 1,
    limit: 10,
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    role: Role.ADMINISTRATOR,
    isActive: true,
  };

  const mockUpdateUserDto: UpdateAuthDto = {
    email: 'updated@example.com',
    firstName: 'John Updated',
    lastName: 'Doe Updated',
    phoneNumber: '+0987654321',
    address: '456 Updated St',
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
            logout: jest
              .fn()
              .mockResolvedValue({ message: 'Successfully logged out' }),
            logoutWithToken: jest
              .fn()
              .mockResolvedValue({ message: 'Successfully logged out' }),
            findAllUsers: jest.fn().mockResolvedValue(mockPaginatedUsers),
            findUserById: jest.fn().mockResolvedValue(mockUserResponse),
            getUserRole: jest.fn().mockResolvedValue(Role.ADMINISTRATOR),
            updateUser: jest.fn().mockResolvedValue(mockUpdatedUserResponse),
            toggleUserActive: jest
              .fn()
              .mockResolvedValue(mockDeactivatedUserResponse),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest.fn().mockResolvedValue({
              message: 'User deactivated successfully',
              data: mockDeactivatedUserResponse.user,
            }),
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
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
    expect(toggleActiveService).toBeDefined();
  });

  describe('signup', () => {
    it('should register a new user', async () => {
      const result = await controller.signup(mockCreateUserDto);
      expect(authService.signup).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should register a new user without optional fields', async () => {
      const basicUserDto = {
        email: 'basic@example.com',
        password: 'password123',
        firstName: 'Basic',
        lastName: 'User',
      };
      await controller.signup(basicUserDto);
      expect(authService.signup).toHaveBeenCalledWith(basicUserDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const result = await controller.login(mockLoginDto);
      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should logout a user with token', async () => {
      const authHeader = 'Bearer jwt_token';
      const result = await controller.logout(authHeader);
      expect(authService.logoutWithToken).toHaveBeenCalledWith('jwt_token');
      expect(result).toEqual({ message: 'Successfully logged out' });
    });

    it('should handle logout without token', async () => {
      const result = await controller.logout(undefined);
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('findAllUsers', () => {
    it('should return paginated users with filters', async () => {
      const result = await controller.findAllUsers(mockFilterUserDto);
      expect(authService.findAllUsers).toHaveBeenCalledWith(mockFilterUserDto);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it('should return paginated users without filters', async () => {
      const result = await controller.findAllUsers({});
      expect(authService.findAllUsers).toHaveBeenCalledWith({});
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

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const result = await controller.deactivateUser('user-id-1');
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'user',
        'user-id-1',
        { isActive: false },
      );
      expect(result).toEqual({
        message: 'User deactivated successfully',
        data: mockDeactivatedUserResponse.user,
      });
    });
  });

  describe('activateUser', () => {
    const mockActivatedUserResponse = {
      message: 'User activated successfully',
      data: {
        ...mockDeactivatedUserResponse.user,
        isActive: true,
      },
    };

    it('should activate a user', async () => {
      jest
        .spyOn(toggleActiveService, 'toggleActive')
        .mockResolvedValueOnce(mockActivatedUserResponse);
      const result = await controller.activateUser('user-id-1');
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'user',
        'user-id-1',
        { isActive: true },
      );
      expect(result).toEqual(mockActivatedUserResponse);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const mockRequest = { user: { id: 'user-id-1' } };
      const result = await controller.getUserRole(mockRequest);
      expect(authService.getUserRole).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(Role.ADMINISTRATOR);
    });
  });
});
