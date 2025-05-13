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
import { AuthService } from './auth.service';
import { Public, Roles } from './decorators';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  @Public()
  @Post('signup')
  signup(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signup(createAuthDto);
  }

  @ApiOperation({ summary: 'Login with credentials' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Public()
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponse,
  })
  @ApiBearerAuth()
  @Public()
  @Post('logout')
  logout(@Headers('authorization') authHeader: string) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return this.authService.logoutWithToken(token);
    }

    return { message: 'Successfully logged out' };
  }

  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
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
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get('users')
  findAllUsers(@Query() filterUserDto: FilterUserDto) {
    return this.authService.findAllUsers(filterUserDto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get('users/:id')
  findUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @ApiOperation({ summary: 'Get current user role' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @Get('role')
  getUserRole(@Request() req) {
    return this.authService.getUserRole(req.user.id);
  }

  @ApiOperation({ summary: 'Update user' })
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
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR)
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.updateUser(id, updateAuthDto);
  }

  @ApiOperation({ summary: 'Deactivate user (logical deletion)' })
  @ApiResponse({
    status: 200,
    description: 'User successfully deactivated',
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Administrators only',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR)
  @Delete('users/:id')
  deactivateUser(@Param('id') id: string) {
    return this.authService.toggleUserActive(id, { isActive: false });
  }

  @ApiOperation({ summary: 'Admin only endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Admin access successful',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR)
  @Get('admin-only')
  adminOnly(@Request() req) {
    return {
      message: 'Admin access successful',
      user: req.user,
    };
  }
}
