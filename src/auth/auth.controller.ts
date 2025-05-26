import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { AuthService } from './auth.service';
import { Public, Roles } from './decorators';
import { PublicRateLimit } from './decorators/throttler.decorator';
import {
  CreateAuthDto,
  FilterUserDto,
  LoginAuthDto,
  UpdateAuthDto,
} from './dto';
import {
  AuthResponse,
  LogoutResponse,
  PaginatedUsersResponse,
  UserResponse,
} from './entities';
import { Role } from './interfaces';

/**
 * Authentication Controller
 *
 * Handles all authentication and user management HTTP endpoints including:
 * - User registration and authentication
 * - User profile management
 * - User activation/deactivation
 * - Role-based access control
 *
 * All endpoints except signup and login require authentication.
 * Some endpoints require specific roles (ADMINISTRATOR, SALESPERSON).
 */
@ApiTags('Authentication')
@Controller('auth')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or expired token',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly toggleActiveService: ToggleActiveService,
  ) {}

  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account. No authentication required.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
  })
  @Public()
  @PublicRateLimit(3, 60000)
  @Post('signup')
  signup(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signup(createAuthDto);
  }

  @ApiOperation({
    summary: 'Login with credentials',
    description:
      'Authenticates user and returns JWT token. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
  })
  @Public()
  @PublicRateLimit(5, 60000)
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @ApiOperation({
    summary: 'Logout current user',
    description:
      'Invalidates the current session token. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponse,
  })
  @Post('logout')
  logout(@Headers('authorization') authHeader: string) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return this.authService.logoutWithToken(token);
    }
    return { message: 'Successfully logged out' };
  }

  @ApiOperation({
    summary: 'Get all users with pagination and filtering',
    description:
      'Retrieves a paginated list of users. Requires authentication and proper role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponse,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    type: String,
    description: 'Filter by first name (partial match)',
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
    type: String,
    description: 'Filter by last name (partial match)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email (partial match)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active/inactive status',
  })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get('users')
  findAllUsers(@Query() filterUserDto: FilterUserDto) {
    return this.authService.findAllUsers(filterUserDto);
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves a specific user by ID. Requires authentication and proper role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get('users/:id')
  findUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @ApiOperation({
    summary: 'Get current user role',
    description:
      'Returns the role of the authenticated user. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @Get('role')
  getUserRole(@Request() req) {
    return this.authService.getUserRole(req.user.id);
  }

  @ApiOperation({
    summary: 'Update user',
    description:
      'Updates user information. Requires authentication and administrator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.updateUser(id, updateAuthDto);
  }

  @ApiOperation({
    summary: 'Deactivate user',
    description:
      'Deactivates a user account (logical deletion). Requires authentication and administrator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR)
  @Delete('users/:id')
  deactivateUser(@Param('id') id: string) {
    return this.toggleActiveService.toggleActive('user', id, {
      isActive: false,
    });
  }

  @ApiOperation({
    summary: 'Activate user',
    description:
      'Activates a previously deactivated user account. Requires authentication and administrator role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR)
  @Post('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.toggleActiveService.toggleActive('user', id, {
      isActive: true,
    });
  }

  @ApiOperation({
    summary: 'Admin only test endpoint',
    description:
      'Test endpoint for administrator role. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Access granted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR)
  @Get('admin')
  adminOnly(@Request() req) {
    return {
      message: 'You have access to admin content',
      userId: req.user.id,
    };
  }
}
