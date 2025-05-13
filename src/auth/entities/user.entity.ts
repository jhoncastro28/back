import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enum equivalent to the one defined in Prisma
export enum Role {
  SALESPERSON = 'SALESPERSON',
  ADMINISTRATOR = 'ADMINISTRATOR',
}

export class User {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier for the user',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  lastName: string;

  @ApiProperty({
    example: 'SALESPERSON',
    description: 'Role of the user',
    enum: Role,
  })
  role: Role;

  @ApiPropertyOptional({
    example: '+1 555-123-4567',
    description: 'Phone number of the user',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City',
    description: 'Address of the user',
  })
  address?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'When the user was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'When the user was last updated',
  })
  updatedAt: Date;
}

export class AuthResponse {
  @ApiProperty({
    example: 'User registered successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'User information',
    type: User,
  })
  user: User;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT authentication token',
  })
  token: string;
}

export class UsersResponse {
  @ApiProperty({
    example: 'Users retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    type: [User],
    description: 'Array of users',
  })
  users: User[];
}

export class PaginatedUsersResponse {
  @ApiProperty({
    example: 'Users retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    type: [User],
    description: 'Array of users for the current page',
  })
  data: User[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 30,
      page: 1,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
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

export class UserResponse {
  @ApiProperty({
    example: 'User found successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'User information',
    type: User,
  })
  user: User;
}
