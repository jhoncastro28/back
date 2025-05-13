import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

/**
 * Filter Client Data Transfer Object
 *
 * DTO for validating client filtering and pagination requests.
 * Contains all parameters that can be used to filter client lists.
 */
export class FilterClientDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Filter clients by name (partial match)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Filter clients by email (exact match)',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '555-123',
    description: 'Filter clients by phone number (partial match)',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Filter clients by identification number (exact match)',
  })
  @IsString()
  @IsOptional()
  identificationNumber?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active/inactive status',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter clients who have made at least one purchase',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasPurchased?: boolean;
}
