import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateDiscountDto, DiscountType } from './create-discount.dto';

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
  @ApiPropertyOptional({
    description: 'The name of the discount',
    example: 'Updated Summer Sale',
  })
  @IsString({ message: 'Discount name must be a string' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the discount',
    example: 'Updated discount description',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of discount (PERCENTAGE or FIXED_AMOUNT)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 15.5,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Discount value must be positive' })
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({
    description: 'Start date of the discount',
    example: '2023-02-01T00:00:00Z',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of the discount',
    example: '2023-11-30T23:59:59Z',
  })
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether the discount is active',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
