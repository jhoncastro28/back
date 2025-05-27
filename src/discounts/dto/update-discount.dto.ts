import { BadRequestException } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateDiscountDto } from './create-discount.dto';
import { DISCOUNT_CONSTANTS, DiscountType } from './discount.types';

/**
 * Data Transfer Object for updating an existing discount
 *
 * @example
 * {
 *   "name": "Updated Summer Sale 2024",
 *   "description": "Updated special discount for summer season",
 *   "type": "FIXED_AMOUNT",
 *   "value": 25.99,
 *   "startDate": "2024-06-15T00:00:00Z",
 *   "endDate": "2024-08-15T23:59:59Z",
 *   "isActive": false
 * }
 */
export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  @ApiPropertyOptional({
    description: 'The name of the discount',
    example: 'Updated Summer Sale 2024',
    minLength: DISCOUNT_CONSTANTS.NAME_MIN_LENGTH,
    maxLength: DISCOUNT_CONSTANTS.NAME_MAX_LENGTH,
  })
  @IsString({ message: 'Discount name must be a string' })
  @Length(
    DISCOUNT_CONSTANTS.NAME_MIN_LENGTH,
    DISCOUNT_CONSTANTS.NAME_MAX_LENGTH,
    {
      message: `Name must be between ${DISCOUNT_CONSTANTS.NAME_MIN_LENGTH} and ${DISCOUNT_CONSTANTS.NAME_MAX_LENGTH} characters`,
    },
  )
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the discount',
    example: 'Updated special discount for summer season 2024',
    maxLength: DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH, {
    message: `Description cannot exceed ${DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH} characters`,
  })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of discount (PERCENTAGE or FIXED_AMOUNT)',
    enum: DiscountType,
    example: DiscountType.FIXED_AMOUNT,
  })
  @IsEnum(DiscountType, {
    message: `Type must be either ${DiscountType.PERCENTAGE} or ${DiscountType.FIXED_AMOUNT}`,
  })
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 25.99,
    minimum: DISCOUNT_CONSTANTS.MIN_PERCENTAGE,
    maximum: DISCOUNT_CONSTANTS.MAX_PERCENTAGE,
  })
  @IsDecimal(
    { decimal_digits: '0,2' },
    {
      message: 'Value must be a decimal number with up to 2 decimal places',
    },
  )
  @IsPositive({ message: 'Value must be positive' })
  @ValidateIf((o) => o.type === DiscountType.PERCENTAGE)
  @Max(DISCOUNT_CONSTANTS.MAX_PERCENTAGE, {
    message: `Percentage discount cannot exceed ${DISCOUNT_CONSTANTS.MAX_PERCENTAGE}%`,
  })
  @ValidateIf((o) => o.type === DiscountType.FIXED_AMOUNT)
  @Max(DISCOUNT_CONSTANTS.MAX_FIXED_AMOUNT, {
    message: `Fixed amount discount cannot exceed ${DISCOUNT_CONSTANTS.MAX_FIXED_AMOUNT}`,
  })
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({
    description: 'Start date of the discount',
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
    description: 'End date of the discount',
    example: '2024-12-31',
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
    description: 'Whether the discount is active',
    example: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  isActive?: boolean;
}
