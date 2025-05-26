import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { PRICE_CONSTANTS } from './price.constants';

export class CreatePriceDto {
  @ApiProperty({
    description: 'The purchase price of the product',
    example: 100.5,
    type: Number,
    minimum: PRICE_CONSTANTS.MIN_PRICE,
    maximum: PRICE_CONSTANTS.MAX_PRICE,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    Number(Number(value).toFixed(PRICE_CONSTANTS.DECIMAL_PLACES)),
  )
  @IsDecimal(
    { decimal_digits: `0,${PRICE_CONSTANTS.DECIMAL_PLACES}` },
    {
      message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PURCHASE_PRICE.DECIMAL,
    },
  )
  @IsPositive({
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PURCHASE_PRICE.POSITIVE,
  })
  @Max(PRICE_CONSTANTS.MAX_PRICE, {
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PURCHASE_PRICE.MAX,
  })
  purchasePrice: number;

  @ApiProperty({
    description: 'The selling price of the product',
    example: 150.75,
    type: Number,
    minimum: PRICE_CONSTANTS.MIN_PRICE,
    maximum: PRICE_CONSTANTS.MAX_PRICE,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    Number(Number(value).toFixed(PRICE_CONSTANTS.DECIMAL_PLACES)),
  )
  @IsDecimal(
    { decimal_digits: `0,${PRICE_CONSTANTS.DECIMAL_PLACES}` },
    {
      message: PRICE_CONSTANTS.VALIDATION_MESSAGES.SELLING_PRICE.DECIMAL,
    },
  )
  @IsPositive({
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.SELLING_PRICE.POSITIVE,
  })
  @Max(PRICE_CONSTANTS.MAX_PRICE, {
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.SELLING_PRICE.MAX,
  })
  sellingPrice: number;

  @ApiProperty({
    description: 'Whether this is the current price for the product',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isCurrentPrice?: boolean = true;

  @ApiProperty({
    description: 'The product ID this price is associated with',
    example: 1,
    minimum: PRICE_CONSTANTS.MIN_PRODUCT_ID,
  })
  @Type(() => Number)
  @IsInt({ message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_ID.INT })
  @Min(PRICE_CONSTANTS.MIN_PRODUCT_ID, {
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_ID.MIN,
  })
  productId: number;
}
