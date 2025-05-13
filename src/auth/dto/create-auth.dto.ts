import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../entities';

export class CreateAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for user registration',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password for user registration (min 6 characters)',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'SALESPERSON',
    description: 'Role of the user (SALESPERSON or ADMINISTRATOR)',
    enum: Role,
    default: 'SALESPERSON',
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
