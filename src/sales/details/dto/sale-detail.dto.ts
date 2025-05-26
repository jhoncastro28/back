import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export class CreateSaleDetailDto {
  @ApiProperty({
    description: 'Product ID to be sold',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Type(() => Number)
  productId: number;

  @ApiProperty({
    description: 'Quantity of products to be sold',
    example: 2,
    minimum: 1,
    maximum: 9999,
  })
  @IsInt()
  @IsPositive()
  @Max(9999, { message: 'Quantity cannot exceed 9999 units' })
  @IsNotEmpty()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the product',
    example: 99.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Unit price must be greater than 0' })
  @IsNotEmpty()
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Discount amount applied to this product',
    example: 10.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;
}

export class UpdateSaleDetailDto {
  @ApiPropertyOptional({
    description: 'Product ID to be updated',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({
    description: 'New quantity of products',
    example: 2,
    minimum: 1,
    maximum: 9999,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(9999, { message: 'Quantity cannot exceed 9999 units' })
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'New unit price of the product',
    example: 99.99,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Unit price must be greater than 0' })
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({
    description: 'New discount amount to be applied',
    example: 10.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;
}
