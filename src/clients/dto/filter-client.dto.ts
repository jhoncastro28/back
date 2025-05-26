import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto';

/**
 * Filter Client Data Transfer Object
 *
 * This DTO validates and transfers client filtering parameters with the following features:
 * - Extends PaginationDto for page and limit handling
 * - All filters are optional and can be combined
 * - Case-insensitive partial matching for text fields
 * - Exact matching for document numbers and email
 * - Boolean transformations for status filters
 * - Length restrictions to prevent excessive queries
 */
export class FilterClientDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Filter clients by name (case-insensitive partial match)',
    maxLength: 100,
  })
  @IsString({ message: 'Name filter must be a string' })
  @MaxLength(100, { message: 'Name filter cannot exceed 100 characters' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Filter clients by exact email match',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+57300',
    description: 'Filter clients by phone number (partial match)',
    maxLength: 15,
  })
  @IsString({ message: 'Phone number filter must be a string' })
  @MaxLength(15, { message: 'Phone number filter cannot exceed 15 characters' })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Bogotá',
    description: 'Filter clients by address (case-insensitive partial match)',
    maxLength: 100,
  })
  @IsString({ message: 'Address filter must be a string' })
  @MaxLength(100, { message: 'Address filter cannot exceed 100 characters' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Filter clients by exact document number match',
    pattern: '^[0-9]+$',
    maxLength: 20,
  })
  @IsString({ message: 'Document number must be a string' })
  @Matches(/^[0-9]+$/, { message: 'Document number must contain only digits' })
  @MaxLength(20, { message: 'Document number cannot exceed 20 characters' })
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter clients by their active/inactive status',
    type: Boolean,
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter clients based on purchase history',
    type: Boolean,
  })
  @IsBoolean({ message: 'hasPurchased must be a boolean value' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasPurchased?: boolean;
}
