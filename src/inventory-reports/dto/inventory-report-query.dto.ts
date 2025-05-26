import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Enum for product status filtering
 */
export enum ProductStatus {
  /** Product is active and available */
  ACTIVE = 'ACTIVE',
  /** Product is inactive or discontinued */
  INACTIVE = 'INACTIVE',
}

/**
 * DTO for inventory report query parameters
 * Used for filtering and pagination in inventory report endpoints
 */
export class InventoryReportQueryDto {
  @ApiProperty({
    required: false,
    description: 'Minimum stock level to filter by',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStock?: number;

  @ApiProperty({
    required: false,
    description: 'Maximum stock level to filter by',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxStock?: number;

  @ApiProperty({
    required: false,
    enum: ProductStatus,
    description: 'Product status to filter by',
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({
    required: false,
    description: 'Search term for product name or description',
    example: 'laptop',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
