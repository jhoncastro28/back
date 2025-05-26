import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAuthDto,
  FilterUserDto,
  LoginAuthDto,
  ToggleActiveDto,
  UpdateAuthDto,
} from './dto';
import { SessionService } from './services/session.service';

/**
 * Authentication Service
 *
 * Handles all authentication-related operations including:
 * - User registration and login
 * - Session management
 * - User management (CRUD operations)
 * - Role-based access control
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly paginationService: PaginationService,
  ) {
    setInterval(async () => {
      try {
        await this.sessionService.cleanupExpiredSessions();
        this.logger.debug('Cleaned up expired sessions');
      } catch (error) {
        this.logger.error(`Error cleaning expired sessions: ${error.message}`);
      }
    }, 3600000);
  }

  /**
   * Creates a new user account with the provided information
   * @param createAuthDto - Data transfer object containing user registration information
   * @returns Object containing success message, user data (excluding password), and JWT token
   * @throws ConflictException if email is already registered
   */
  async signup(createAuthDto: CreateAuthDto) {
    const { email, password, firstName, lastName, role, phoneNumber, address } =
      createAuthDto;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role ?? undefined,
        phoneNumber,
        address,
      },
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    await this.sessionService.trackSession(newUser.id, token);

    return {
      message: 'User registered successfully',
      user: this.excludePassword(newUser),
      token,
    };
  }

  /**
   * Authenticates a user and creates a new session
   * @param loginAuthDto - Data transfer object containing login credentials
   * @returns Object containing success message, user data (excluding password), and JWT token
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    await this.sessionService.trackSession(user.id, token);

    return {
      message: 'Login successful',
      user: this.excludePassword(user),
      token,
    };
  }

  /**
   * Logs out a user by invalidating their JWT token
   * @param userId - The ID of the user to logout
   * @param tokenId - Optional specific token to invalidate
   * @returns Success message object
   * @throws UnauthorizedException if logout process fails
   */
  async logout(userId: string, tokenId?: string) {
    try {
      if (tokenId) {
        await this.sessionService.invalidateSession(userId, tokenId);
        this.logger.debug(`Token invalidated: ${tokenId}`);
      } else {
        await this.sessionService.invalidateAllUserSessions(userId);
        this.logger.debug(`User's tokens invalidated: ${userId}`);
      }

      return {
        message: 'Successfully logged out',
      };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      throw new UnauthorizedException('Error during logout process');
    }
  }

  /**
   * Invalidates a specific JWT token
   * @param token - The JWT token to invalidate
   * @returns Success message object
   */
  async logoutWithToken(token: string) {
    try {
      try {
        const decoded = this.jwtService.verify(token);
        if (decoded?.sub) {
          await this.sessionService.invalidateSession(decoded.sub, token);
          this.logger.debug(`User's session invalidated: ${decoded.sub}`);
        }
      } catch (error) {
        this.logger.warn(`Could not decode token: ${error.message}`);
      }

      return {
        message: 'Successfully logged out',
      };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      return {
        message: 'Successfully logged out',
      };
    }
  }

  /**
   * Checks if a token has been invalidated
   * @param token - The JWT token to check
   * @returns boolean indicating if the token is invalidated
   */
  isTokenInvalidated(token: string): boolean {
    try {
      if (!token) {
        this.logger.warn('No token provided');
        return true;
      }

      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
        this.logger.warn('Invalid token format');
        return true;
      }

      const isActive = this.sessionService.isSessionActive(decoded.sub, token);
      this.logger.debug(
        `Token active status for user ${decoded.sub}: ${isActive}`,
      );
      return !isActive;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return true;
    }
  }

  /**
   * Retrieves a paginated list of users with optional filters
   * @param filterUserDto - Data transfer object containing filter criteria
   * @returns Paginated response containing filtered user data
   */
  async findAllUsers(
    filterUserDto: FilterUserDto = {},
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      firstName,
      lastName,
      email,
      role,
      isActive,
    } = filterUserDto;

    const where: any = {};

    if (firstName) {
      where.firstName = {
        contains: firstName,
        mode: 'insensitive',
      };
    }

    if (lastName) {
      where.lastName = {
        contains: lastName,
        mode: 'insensitive',
      };
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phoneNumber: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return this.paginationService.createPaginationObject(
      users,
      total,
      page,
      limit,
      'Users retrieved successfully',
    );
  }

  /**
   * Retrieves a user by their ID
   * @param id - The ID of the user to find
   * @returns User data excluding password
   * @throws NotFoundException if user is not found
   */
  async findUserById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
      message: 'User found successfully',
    };
  }

  /**
   * Updates user information
   * @param id - The ID of the user to update
   * @param updateAuthDto - Data transfer object containing update information
   * @returns Updated user data excluding password
   * @throws NotFoundException if user is not found
   */
  async updateUser(id: string, updateAuthDto: UpdateAuthDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    let hashedPassword = undefined;
    if (updateAuthDto.password) {
      hashedPassword = await bcrypt.hash(updateAuthDto.password, 10);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        ...updateAuthDto,
        password: hashedPassword ?? undefined,
      },
    });

    return {
      message: 'User updated successfully',
      user: this.excludePassword(updatedUser),
    };
  }

  /**
   * Toggles a user's active status
   * @param id - The ID of the user to toggle
   * @param toggleActiveDto - Data transfer object containing active status
   * @returns Updated user data excluding password
   * @throws NotFoundException if user is not found
   */
  async toggleUserActive(id: string, toggleActiveDto: ToggleActiveDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        isActive: toggleActiveDto.isActive,
      },
    });

    return {
      message: toggleActiveDto.isActive
        ? 'User activated successfully'
        : 'User deactivated successfully',
      user: this.excludePassword(updatedUser),
    };
  }

  /**
   * Retrieves a user's role
   * @param userId - The ID of the user
   * @returns The user's role
   * @throws NotFoundException if user is not found
   */
  async getUserRole(userId: string): Promise<Role> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role;
  }

  /**
   * Generates a JWT token for a user
   * @param userId - The user's ID
   * @param email - The user's email
   * @param role - The user's role
   * @returns Signed JWT token
   */
  private generateToken(userId: string, email: string, role: Role): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Safely removes the password field from a user object
   * @param user User object that may contain a password
   * @returns User object without the password field
   */
  private excludePassword<T extends { password?: string }>(
    user: T,
  ): Omit<T, 'password'> {
    if (!user) return user;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
