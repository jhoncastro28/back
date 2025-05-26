import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../interfaces';

/**
 * Data Transfer Object for updating user information
 *
 * This DTO validates and transfers user update data with the following features:
 * - All fields are optional
 * - Strong validation rules when fields are provided
 * - Consistent with creation validation rules
 */
export class UpdateAuthDto {
  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'User email address',
    format: 'email',
    uniqueItems: true,
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'StrongP@ss123',
    description:
      'User password - must contain uppercase, lowercase, number and special character',
    minLength: 8,
    maxLength: 32,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'User last name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'SALESPERSON',
    description: 'User role in the system',
    enum: Role,
  })
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number in international format',
    pattern: '^\+?[1-9]\d{1,14}$',
  })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, Country',
    description: 'User physical address',
    maxLength: 200,
  })
  @IsString({ message: 'Address must be a string' })
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  @IsOptional()
  address?: string;
}
