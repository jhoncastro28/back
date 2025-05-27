import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { DISCOUNT_CONSTANTS, DiscountType } from './discount.types';

/**
 * Data Transfer Object for creating a new discount
 *
 * @example
 * {
 *   "name": "Summer Sale 2024",
 *   "description": "Special discount for summer season",
 *   "type": "PERCENTAGE",
 *   "value": 10.5,
 *   "startDate": "2024-06-01T00:00:00Z",
 *   "endDate": "2024-08-31T23:59:59Z",
 *   "isActive": true,
 *   "priceId": 1
 * }
 */
export class CreateDiscountDto {
  @ApiProperty({
    description: 'The name of the discount',
    example: 'Summer Sale 2024',
    minLength: DISCOUNT_CONSTANTS.NAME_MIN_LENGTH,
    maxLength: DISCOUNT_CONSTANTS.NAME_MAX_LENGTH,
  })
  @IsNotEmpty({ message: 'Discount name is required' })
  @IsString({ message: 'Discount name must be a string' })
  @Length(
    DISCOUNT_CONSTANTS.NAME_MIN_LENGTH,
    DISCOUNT_CONSTANTS.NAME_MAX_LENGTH,
    {
      message: `Name must be between ${DISCOUNT_CONSTANTS.NAME_MIN_LENGTH} and ${DISCOUNT_CONSTANTS.NAME_MAX_LENGTH} characters`,
    },
  )
  name: string;

  @ApiProperty({
    description: 'Description of the discount',
    example: 'Special discount for summer season 2024',
    required: false,
    maxLength: DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH,
  })
  @IsString({ message: 'Description must be a string' })
  @MaxLength(DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH, {
    message: `Description cannot exceed ${DISCOUNT_CONSTANTS.DESCRIPTION_MAX_LENGTH} characters`,
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of discount (PERCENTAGE or FIXED_AMOUNT)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    default: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType, {
    message: `Type must be either ${DiscountType.PERCENTAGE} or ${DiscountType.FIXED_AMOUNT}`,
  })
  @IsOptional()
  type?: DiscountType = DiscountType.PERCENTAGE;

  @ApiProperty({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 10.5,
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
  value: number;

  @ApiProperty({
    description: 'Start date of the discount',
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
  startDate: Date;

  @ApiProperty({
    description: 'End date of the discount',
    example: '2024-12-31',
    required: false,
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

  @ApiProperty({
    description: 'Whether the discount is active',
    example: true,
    default: true,
  })
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'The price ID this discount is associated with',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Price ID must be an integer' })
  @Min(1, { message: 'Price ID must be at least 1' })
  priceId: number;
}
