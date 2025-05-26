import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { PRODUCT_CONSTANTS } from './product.constants';

export enum StockAdjustmentType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export class AdjustStockDto {
  @ApiProperty({
    description: 'Type of stock adjustment (INCREASE or DECREASE)',
    enum: StockAdjustmentType,
    example: StockAdjustmentType.INCREASE,
  })
  @IsNotEmpty({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.TYPE.NOT_EMPTY,
  })
  @IsEnum(StockAdjustmentType, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.TYPE.INVALID,
  })
  type: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity to adjust (positive number)',
    example: 5,
    minimum: 1,
    maximum: PRODUCT_CONSTANTS.STOCK.MAX,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.QUANTITY.INTEGER,
  })
  @IsPositive({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.QUANTITY.POSITIVE,
  })
  @Max(PRODUCT_CONSTANTS.STOCK.MAX, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.QUANTITY.MAX,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reason for the stock adjustment',
    example: 'Inventory count correction',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.REASON.STRING,
  })
  @MaxLength(200, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.REASON.MAX_LENGTH,
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the adjustment',
    example: 'Physical count showed 5 more items than in system',
    maxLength: PRODUCT_CONSTANTS.DESCRIPTION.MAX_LENGTH,
  })
  @IsOptional()
  @IsString({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.NOTES.STRING,
  })
  @MaxLength(PRODUCT_CONSTANTS.DESCRIPTION.MAX_LENGTH, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.STOCK.NOTES.MAX_LENGTH,
  })
  notes?: string;
}
