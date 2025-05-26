import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../interfaces';

export class User {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier (UUID) for the user',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user (unique)',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    minLength: 2,
    maxLength: 50,
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    minLength: 2,
    maxLength: 50,
  })
  lastName: string;

  @ApiProperty({
    example: Role.SALESPERSON,
    description: 'Role and permissions level of the user in the system',
    enum: Role,
    enumName: 'Role',
  })
  role: Role;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact phone number in international format',
    pattern: '^\+?[1-9]\d{1,14}$',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, Country',
    description: 'Physical address for shipping or contact purposes',
    maxLength: 200,
  })
  address?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is currently active',
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Timestamp of when the user account was created',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Timestamp of the last update to the user account',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Authentication Response
 *
 * Response entity for successful authentication operations
 * (login, registration, token refresh)
 */
export class AuthResponse {
  @ApiProperty({
    example: 'Authentication successful',
    description: 'Status message for the authentication operation',
  })
  message: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: User,
  })
  user: User;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token for subsequent authenticated requests',
    format: 'jwt',
  })
  token: string;
}

/**
 * Users List Response
 *
 * Response entity for operations that return multiple users
 */
export class UsersResponse {
  @ApiProperty({
    example: 'Users retrieved successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    type: [User],
    description: 'Array of user objects',
  })
  users: User[];
}

/**
 * Paginated Users Response
 *
 * Response entity for paginated user listing operations
 * Includes metadata for pagination handling
 */
export class PaginatedUsersResponse {
  @ApiProperty({
    example: 'Users retrieved successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    type: [User],
    description: 'Array of user objects for the current page',
  })
  data: User[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total number of users across all pages',
      },
      page: {
        type: 'number',
        description: 'Current page number',
      },
      limit: {
        type: 'number',
        description: 'Number of items per page',
      },
      totalPages: {
        type: 'number',
        description: 'Total number of pages',
      },
      hasNextPage: {
        type: 'boolean',
        description: 'Whether there is a next page available',
      },
      hasPreviousPage: {
        type: 'boolean',
        description: 'Whether there is a previous page available',
      },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Single User Response
 *
 * Response entity for operations that return a single user
 */
export class UserResponse {
  @ApiProperty({
    example: 'User found successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    description: 'User information',
    type: User,
  })
  user: User;
}
