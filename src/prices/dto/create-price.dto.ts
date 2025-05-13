import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({
    description: 'The purchase price of the product',
    example: 100.5,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Purchase price must be positive' })
  purchasePrice: number;

  @ApiProperty({
    description: 'The selling price of the product',
    example: 150.75,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Selling price must be positive' })
  sellingPrice: number;

  @ApiProperty({
    description: 'Whether this is the current price for the product',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isCurrentPrice?: boolean = true;

  @ApiProperty({
    description: 'The product ID this price is associated with',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Product ID must be an integer' })
  @Min(1, { message: 'Product ID must be at least 1' })
  productId: number;
}
