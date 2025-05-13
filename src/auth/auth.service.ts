import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from '../common/interfaces';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAuthDto,
  FilterUserDto,
  LoginAuthDto,
  ToggleActiveDto,
  UpdateAuthDto,
} from './dto';
import { Role } from './interfaces';

@Injectable()
export class AuthService {
  // Token expiration times in seconds
  private readonly TOKEN_EXPIRATION = {
    short: 3600, // 1 hour
    medium: 86400, // 24 hours
    long: 604800, // 7 days
  };

  private invalidatedTokens: Set<string> = new Set();

  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Clean expired tokens every hour
    setInterval(() => this.cleanExpiredTokens(), 3600000);
  }

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

    // Generate JWT token (medium expiration - 24h)
    const token = this.generateToken(
      newUser.id,
      newUser.email,
      newUser.role,
      this.TOKEN_EXPIRATION.medium,
    );

    return {
      message: 'User registered successfully',
      user: this.excludePassword(newUser),
      token,
    };
  }

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

    // Generate JWT token (medium expiration - 24h)
    const token = this.generateToken(
      user.id,
      user.email,
      user.role,
      this.TOKEN_EXPIRATION.medium,
    );

    // Return user data without password
    return {
      message: 'Login successful',
      user: this.excludePassword(user),
      token,
    };
  }

  /**
   * Logs out a user by invalidating their JWT token
   * @param userId The ID of the user to logout
   * @param tokenId Optional specific token to invalidate
   * @returns Success message object
   */
  async logout(userId: string, tokenId?: string) {
    try {
      if (tokenId) {
        this.invalidatedTokens.add(tokenId);
        this.logger.debug(`Token invalidated: ${tokenId}`);
      } else {
        this.invalidatedTokens.add(userId);
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
   * Logout using a raw token string
   * @param token The JWT token to invalidate
   * @returns Success message object
   */
  async logoutWithToken(token: string) {
    try {
      this.invalidatedTokens.add(token);
      this.logger.debug(`Token invalidated: ${token.substring(0, 10)}...`);

      try {
        const decoded = this.jwtService.verify(token);
        if (decoded?.sub) {
          this.invalidatedTokens.add(decoded.sub);
          this.logger.debug(`User's tokens invalidated: ${decoded.sub}`);
        }
      } catch (error) {
        this.logger.warn(`Could not decode token, but still blacklisted it`);
        this.logger.error(
          `Error decoding token: ${error.message}. Token blacklisted anyway.`,
        );
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

  isTokenInvalidated(token: string): boolean {
    return this.invalidatedTokens.has(token);
  }

  private cleanExpiredTokens() {
    try {
      const currentTokens = [...this.invalidatedTokens];
      let removedCount = 0;

      for (const token of currentTokens) {
        try {
          this.jwtService.verify(token);
        } catch (error) {
          if (error.name === 'TokenExpiredError') {
            this.invalidatedTokens.delete(token);
            removedCount++;
          }
        }
      }

      if (removedCount > 0) {
        this.logger.debug(
          `Removed ${removedCount} expired tokens from blacklist`,
        );
      }
    } catch (error) {
      this.logger.error(`Error cleaning expired tokens: ${error.message}`);
    }
  }

  async findAllUsers(
    filterUserDto: FilterUserDto = {},
  ): Promise<PaginatedResult<any>> {
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

    // Apply filters if provided
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

    const skip = (page - 1) * limit;

    const users = await this.prismaService.user.findMany({
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
    });

    const total = await this.prismaService.user.count({ where });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      message: 'Users retrieved successfully',
    };
  }

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

  async getUserRole(userId: string) {
    const result = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return result;
  }

  private generateToken(
    userId: string,
    email: string,
    role: Role,
    expiresInSeconds: number = this.TOKEN_EXPIRATION.medium,
  ): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
    });
  }

  private excludePassword<T extends { password?: string }>(
    user: T,
  ): Omit<T, 'password'> {
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }
}
