import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PRODUCT_CONSTANTS } from './product.constants';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Samsung Galaxy S21 Smartphone',
    minLength: PRODUCT_CONSTANTS.NAME.MIN_LENGTH,
    maxLength: PRODUCT_CONSTANTS.NAME.MAX_LENGTH,
  })
  @IsNotEmpty({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.NOT_EMPTY })
  @IsString({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.STRING })
  @MinLength(PRODUCT_CONSTANTS.NAME.MIN_LENGTH, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.MIN_LENGTH,
  })
  @MaxLength(PRODUCT_CONSTANTS.NAME.MAX_LENGTH, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.NAME.MAX_LENGTH,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'Smartphone with 6.2-inch screen, 128GB storage',
    maxLength: PRODUCT_CONSTANTS.DESCRIPTION.MAX_LENGTH,
  })
  @IsOptional()
  @IsString({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.DESCRIPTION.STRING,
  })
  @MaxLength(PRODUCT_CONSTANTS.DESCRIPTION.MAX_LENGTH, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.DESCRIPTION.MAX_LENGTH,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Minimum quantity that should be in inventory',
    example: 5,
    default: 0,
    minimum: PRODUCT_CONSTANTS.STOCK.MIN,
    maximum: PRODUCT_CONSTANTS.STOCK.MAX,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.MIN_QUANTITY.INTEGER,
  })
  @Min(PRODUCT_CONSTANTS.STOCK.MIN, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.MIN_QUANTITY.MIN,
  })
  @Max(PRODUCT_CONSTANTS.STOCK.MAX)
  minQuantity?: number = 0;

  @ApiPropertyOptional({
    description: 'Maximum quantity that should be in inventory',
    example: 100,
    minimum: 1,
    maximum: PRODUCT_CONSTANTS.STOCK.MAX,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.MAX_QUANTITY.INTEGER,
  })
  @IsPositive({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.MAX_QUANTITY.POSITIVE,
  })
  @Max(PRODUCT_CONSTANTS.STOCK.MAX)
  maxQuantity?: number;

  @ApiProperty({
    description: 'Product supplier ID',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNotEmpty({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.SUPPLIER_ID.NOT_EMPTY,
  })
  @IsInt({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.SUPPLIER_ID.INTEGER })
  @IsPositive({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.SUPPLIER_ID.POSITIVE,
  })
  supplierId: number;

  @ApiProperty({
    description: 'Product purchase price',
    example: 350.5,
    minimum: PRODUCT_CONSTANTS.PRICE.MIN,
    maximum: PRODUCT_CONSTANTS.PRICE.MAX,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    Number(Number(value).toFixed(PRODUCT_CONSTANTS.PRICE.DECIMAL_PLACES)),
  )
  @IsNotEmpty({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.NOT_EMPTY,
  })
  @IsNumber(
    { maxDecimalPlaces: PRODUCT_CONSTANTS.PRICE.DECIMAL_PLACES },
    {
      message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.DECIMAL,
    },
  )
  @IsPositive({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.POSITIVE })
  @Max(PRODUCT_CONSTANTS.PRICE.MAX, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.MAX,
  })
  purchasePrice: number;

  @ApiProperty({
    description: 'Product selling price',
    example: 500.0,
    minimum: PRODUCT_CONSTANTS.PRICE.MIN,
    maximum: PRODUCT_CONSTANTS.PRICE.MAX,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    Number(Number(value).toFixed(PRODUCT_CONSTANTS.PRICE.DECIMAL_PLACES)),
  )
  @IsNotEmpty({
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.NOT_EMPTY,
  })
  @IsNumber(
    { maxDecimalPlaces: PRODUCT_CONSTANTS.PRICE.DECIMAL_PLACES },
    {
      message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.DECIMAL,
    },
  )
  @IsPositive({ message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.POSITIVE })
  @Max(PRODUCT_CONSTANTS.PRICE.MAX, {
    message: PRODUCT_CONSTANTS.VALIDATION_MESSAGES.PRICE.MAX,
  })
  sellingPrice: number;
}
