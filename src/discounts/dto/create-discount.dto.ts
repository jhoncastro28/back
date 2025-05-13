import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

// Define an enum for discount types
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreateDiscountDto {
  @ApiProperty({
    description: 'The name of the discount',
    example: 'Summer Sale',
  })
  @IsNotEmpty({ message: 'Discount name is required' })
  @IsString({ message: 'Discount name must be a string' })
  name: string;

  @ApiProperty({
    description: 'Description of the discount',
    example: 'Special discount for summer season',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of discount (PERCENTAGE or FIXED_AMOUNT)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    default: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  @IsOptional()
  type?: DiscountType = DiscountType.PERCENTAGE;

  @ApiProperty({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 10.5,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Discount value must be positive' })
  value: number;

  @ApiProperty({
    description: 'Start date of the discount',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  startDate: string;

  @ApiProperty({
    description: 'End date of the discount (optional)',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsOptional()
  endDate?: string;

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
  })
  @Type(() => Number)
  @IsInt({ message: 'Price ID must be an integer' })
  @Min(1, { message: 'Price ID must be at least 1' })
  priceId: number;
}
