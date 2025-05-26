import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Pagination Data Transfer Object
 *
 * Common DTO used for pagination across the application.
 * Provides standardized parameters for paginated API endpoints,
 * including validation for page numbers and limits.
 *
 * @example
 * {
 *   "page": 1,
 *   "limit": 10,
 * }
 *
 * Usage:
 * - Extend this class for entity-specific pagination DTOs
 * - Use directly for simple pagination scenarios
 * - Combine with sorting and filtering DTOs as needed
 */
export class PaginationDto {
  /**
   * Page number (starting from 1)
   * Determines which page of results to retrieve
   *
   * @minimum 1
   * @maximum 1000
   * @default 1
   */
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starting from 1)',
    default: 1,
    minimum: 1,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  @IsOptional()
  page?: number = 1;

  /**
   * Number of items per page
   * Controls how many items to include in each page of results
   *
   * @minimum 1
   * @maximum 100
   * @default 10
   */
  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit?: number = 10;
}
