import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDetailDto {
  @ApiProperty({ description: 'Quantity of products', example: 5 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Unit price of the product', example: 10.99 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({
    description: 'Discount amount (if any)',
    example: 2.5,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  productId: number;
}

export class UpdateSaleDetailDto {
  @ApiProperty({
    description: 'Quantity of products',
    example: 5,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Unit price of the product',
    example: 10.99,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({
    description: 'Discount amount (if any)',
    example: 2.5,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ description: 'Product ID', example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  productId?: number;
}

export class SaleDetailResponseDto {
  id: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  subtotal: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    description?: string;
  };
  saleId: number;
  createdAt: Date;
  updatedAt: Date;
}
