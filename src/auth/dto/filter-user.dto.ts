import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../interfaces';

/**
 * Data Transfer Object for filtering users with pagination
 *
 * This DTO extends PaginationDto and adds filtering capabilities:
 * - Search by name (first name and last name)
 * - Search by email
 * - Filter by role
 * - Filter by active status
 * - All filters are optional and can be combined
 */
export class FilterUserDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter users by first name (case-insensitive partial match)',
    example: 'John',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name filter must not exceed 50 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Filter users by last name (case-insensitive partial match)',
    example: 'Doe',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name filter must not exceed 50 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Filter users by email (case-insensitive partial match)',
    example: 'john.doe@example.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @MaxLength(100, { message: 'Email filter must not exceed 100 characters' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter users by their assigned role',
    enum: Role,
    example: Role.ADMINISTRATOR,
    enumName: 'Role',
  })
  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter users by their active/inactive status',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @Type(() => Boolean)
  isActive?: boolean;
}
