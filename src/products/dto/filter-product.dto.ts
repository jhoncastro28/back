import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PRODUCT_CONSTANTS } from './product.constants';

export enum StockStatus {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class FilterProductDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter products by name',
    example: 'Smartphone',
    maxLength: PRODUCT_CONSTANTS.NAME.MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.STRING })
  @MaxLength(PRODUCT_CONSTANTS.NAME.MAX_LENGTH, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.MAX_LENGTH,
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by active/inactive status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by supplier ID',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.SUPPLIER_ID.INTEGER })
  @Min(1, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.SUPPLIER_ID.POSITIVE,
  })
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filter by stock status',
    example: StockStatus.LOW,
    enum: StockStatus,
  })
  @IsOptional()
  @IsEnum(StockStatus, {
    message: 'Stock status must be one of: low, normal, high, critical',
  })
  stockStatus?: StockStatus;
}
