import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Pagination Data Transfer Object
 *
 * Common DTO used for pagination across the application.
 * Provides standardized parameters for paginated API endpoints,
 * including validation for page numbers and limits.
 *
 * This is a reusable component to ensure consistent pagination
 * behavior across different entities (users, clients, etc.).
 */
export class PaginationDto {
  /**
   * Page number (starting from 1)
   * Determines which page of results to retrieve
   */
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starting from 1)',
    default: 1,
  })
  @Type(() => Number) // Transforms the string value to number
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number;

  /**
   * Number of items per page
   * Controls how many items to include in each page of results
   */
  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @Type(() => Number) // Transforms the string value to number
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @IsOptional()
  limit?: number;
}
