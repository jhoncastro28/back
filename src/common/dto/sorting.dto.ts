import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Sort Direction Enum
 * Defines the possible sorting directions
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sorting Data Transfer Object
 *
 * Common DTO used for sorting across the application.
 * Provides standardized parameters for sorted API endpoints.
 *
 * @example
 * {
 *   "sortBy": "createdAt",
 *   "sortDirection": "desc"
 * }
 *
 * Usage:
 * - Extend this class for entity-specific sorting DTOs
 * - Use directly for simple sorting scenarios
 * - Combine with pagination and filtering DTOs as needed
 */
export class SortingDto {
  /**
   * Field to sort by
   * The name of the field/column to sort the results
   *
   * @example "createdAt"
   * @example "name"
   */
  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsString({ message: 'Sort field must be a string' })
  @IsOptional()
  sortBy?: string;

  /**
   * Sort direction
   * The direction to sort the results (ascending or descending)
   *
   * @example "asc"
   * @example "desc"
   * @default "desc"
   */
  @ApiPropertyOptional({
    enum: SortDirection,
    example: SortDirection.DESC,
    description: 'Sort direction (asc/desc)',
    default: SortDirection.DESC,
  })
  @IsEnum(SortDirection, {
    message: 'Sort direction must be either "asc" or "desc"',
  })
  @IsOptional()
  sortDirection?: SortDirection = SortDirection.DESC;
}
