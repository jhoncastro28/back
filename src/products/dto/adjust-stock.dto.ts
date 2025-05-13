import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsNotEmpty()
  @IsEnum(StockAdjustmentType)
  type: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity to adjust (positive number)',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reason for the stock adjustment',
    example: 'Inventory count correction',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the adjustment',
    example: 'Physical count showed 5 more items than in system',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
