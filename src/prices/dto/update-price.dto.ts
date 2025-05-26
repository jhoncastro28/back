import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsOptional,
  IsPositive,
  Max,
} from 'class-validator';
import { CreatePriceDto } from './create-price.dto';
import { PRICE_CONSTANTS } from './price.constants';

export class UpdatePriceDto extends PartialType(CreatePriceDto) {
  @ApiPropertyOptional({
    description: 'The purchase price of the product',
    example: 110.5,
    type: Number,
    minimum: PRICE_CONSTANTS.MIN_PRICE,
    maximum: PRICE_CONSTANTS.MAX_PRICE,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    value
      ? Number(Number(value).toFixed(PRICE_CONSTANTS.DECIMAL_PLACES))
      : value,
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
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({
    description: 'The selling price of the product',
    example: 165.25,
    type: Number,
    minimum: PRICE_CONSTANTS.MIN_PRICE,
    maximum: PRICE_CONSTANTS.MAX_PRICE,
  })
  @Type(() => Number)
  @Transform(({ value }) =>
    value
      ? Number(Number(value).toFixed(PRICE_CONSTANTS.DECIMAL_PLACES))
      : value,
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
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({
    description: 'Whether this is the current price for the product',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isCurrentPrice?: boolean;
}
