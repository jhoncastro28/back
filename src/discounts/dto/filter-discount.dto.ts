import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  DISCOUNT_CONSTANTS,
  DiscountStatus,
  DiscountType,
} from './discount.types';

/**
 * Data Transfer Object for filtering discounts
 *
 * @example
 * {
 *   "name": "Summer",
 *   "type": "PERCENTAGE",
 *   "isActive": true,
 *   "priceId": 1,
 *   "startDateFrom": "2024-06-01T00:00:00Z",
 *   "startDateTo": "2024-08-31T23:59:59Z",
 *   "isCurrentlyValid": true,
 *   "status": "ACTIVE",
 *   "page": 1,
 *   "limit": 10,
 *   "sortBy": "startDate",
 *   "sortDirection": "desc"
 * }
 */
export class FilterDiscountDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by discount name (case-insensitive partial match)',
    example: 'Summer',
    maxLength: DISCOUNT_CONSTANTS.NAME_MAX_LENGTH,
  })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(DISCOUNT_CONSTANTS.NAME_MAX_LENGTH, {
    message: `Name cannot exceed ${DISCOUNT_CONSTANTS.NAME_MAX_LENGTH} characters`,
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by discount type',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType, {
    message: `Type must be either ${DiscountType.PERCENTAGE} or ${DiscountType.FIXED_AMOUNT}`,
  })
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({
    description: 'Filter by discount status',
    enum: DiscountStatus,
    example: DiscountStatus.ACTIVE,
  })
  @IsEnum(DiscountStatus, {
    message: 'Invalid discount status',
  })
  @IsOptional()
  status?: DiscountStatus;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by price ID',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Price ID must be an integer' })
  @Min(1, { message: 'Price ID must be at least 1' })
  @IsOptional()
  priceId?: number;

  @ApiPropertyOptional({
    description: 'Filter by start date (from)',
    example: '2024-06-01T00:00:00Z',
  })
  @IsDateString(
    {},
    {
      message:
        'Start date (from) must be a valid ISO date string (e.g., 2024-06-01T00:00:00Z)',
    },
  )
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (to)',
    example: '2024-08-31T23:59:59Z',
  })
  @IsDateString(
    {},
    {
      message:
        'Start date (to) must be a valid ISO date string (e.g., 2024-08-31T23:59:59Z)',
    },
  )
  @IsOptional()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (from)',
    example: '2024-06-01T00:00:00Z',
  })
  @IsDateString(
    {},
    {
      message:
        'End date (from) must be a valid ISO date string (e.g., 2024-06-01T00:00:00Z)',
    },
  )
  @IsOptional()
  endDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (to)',
    example: '2024-08-31T23:59:59Z',
  })
  @IsDateString(
    {},
    {
      message:
        'End date (to) must be a valid ISO date string (e.g., 2024-08-31T23:59:59Z)',
    },
  )
  @IsOptional()
  endDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by current validity (active and within date range)',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isCurrentlyValid must be a boolean value' })
  @IsOptional()
  isCurrentlyValid?: boolean;
}
