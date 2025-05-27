import { BadRequestException } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DiscountType } from '../../../generated/prisma';

export class CreatePriceDto {
  @IsNotEmpty()
  @IsDecimal()
  purchasePrice: number;

  @IsNotEmpty()
  @IsDecimal()
  sellingPrice: number;

  @IsOptional()
  @IsBoolean()
  isCurrentPrice?: boolean = true;
}

export class CreateDiscountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNotEmpty()
  @IsDecimal()
  value: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

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
}

export class CreateProductWithPriceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minQuantity?: number = 0;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxQuantity?: number;

  @IsNotEmpty()
  @IsNumber()
  supplierId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePriceDto)
  price?: CreatePriceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDiscountDto)
  discount?: CreateDiscountDto;
}
