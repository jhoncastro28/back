import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DiscountType } from './create-discount.dto';

export class FilterDiscountDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by discount name',
    example: 'Summer',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by discount type',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by price ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Price ID must be an integer' })
  @Min(1, { message: 'Price ID must be at least 1' })
  @IsOptional()
  priceId?: number;

  @ApiPropertyOptional({
    description: 'Filter by start date (from)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (to)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  startDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (from)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  endDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (to)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by current validity (active now)',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isCurrentlyValid?: boolean;
}
