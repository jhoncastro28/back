import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class SearchSupplierDto {
  @ApiPropertyOptional({
    description: 'Filter suppliers by their active status',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Search term to filter suppliers by name, contact, email, or document number',
    example: 'tech',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Search term must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Page number must be greater than 0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Items per page must be at least 1' })
  @Max(100, { message: 'Items per page cannot exceed 100' })
  limit?: number = 10;
}

export class SupplierResponseDto {
  @ApiPropertyOptional({
    description: 'Total number of suppliers that match the search criteria',
    example: 150,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiPropertyOptional({
    description: 'Total number of pages available',
    example: 15,
  })
  totalPages: number;

  @ApiPropertyOptional({
    description: 'Whether there is a next page available',
    example: true,
  })
  hasNextPage: boolean;

  @ApiPropertyOptional({
    description: 'Whether there is a previous page available',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiPropertyOptional({
    description: 'List of suppliers that match the search criteria',
    type: 'array',
  })
  data: any[];
}
