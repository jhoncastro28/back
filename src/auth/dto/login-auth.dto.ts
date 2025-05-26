import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for user authentication
 *
 * Handles login credentials validation with:
 * - Email format validation
 * - Required field checks
 * - Basic input sanitization
 *
 * @example
 * ```typescript
 * {
 *   "email": "user@example.com",
 *   "password": "userPassword123"
 * }
 * ```
 */
export class LoginAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for login',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password for login',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
