import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateDetailDto {
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

export class CreateSaleDto {
  @ApiProperty({
    description: 'Client ID who made the purchase',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  clientId: number;

  @ApiProperty({
    description: 'Date when the sale was made',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  })
  saleDate: Date;

  @ApiProperty({
    description: 'List of products to be sold',
    type: [CreateDetailDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one product must be included in the sale',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateDetailDto)
  details: CreateDetailDto[];

  @ApiPropertyOptional({
    description: 'Additional notes about the sale',
    example: 'sale of seasonal products',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSaleDto {
  @ApiPropertyOptional({
    description: 'Client ID who made the purchase',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Date when the sale was made',
    example: '2024-01-01',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  })
  saleDate?: Date;

  @ApiPropertyOptional({
    description: 'notes about the sale',
    example: 'this is a sale of seasonal products',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SaleFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering sales',
    example: '2024-01-01',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for filtering sales',
    example: '2024-01-01',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  })
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Client ID for filtering sales',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
