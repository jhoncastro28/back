import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Samsung Galaxy S21 Smartphone',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'Smartphone with 6.2-inch screen, 128GB storage',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Minimum quantity that should be in inventory',
    example: 5,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity that should be in inventory',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxQuantity?: number;

  @ApiProperty({
    description: 'Product supplier ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  supplierId: number;

  @ApiProperty({
    description: 'Product purchase price',
    example: 350.5,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchasePrice: number;

  @ApiProperty({
    description: 'Product selling price',
    example: 500.0,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  sellingPrice: number;
}
