import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../entities';

export class UpdateAuthDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email address for user',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'Password for user (min 6 characters)',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'SALESPERSON',
    description: 'Role of the user (SALESPERSON or ADMINISTRATOR)',
    enum: Role,
  })
  @IsEnum(Role, { message: 'Role must be either SALESPERSON or ADMINISTRATOR' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: '+1 555-123-4567',
    description: 'Phone number of the user',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City',
    description: 'Address of the user',
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;
}
