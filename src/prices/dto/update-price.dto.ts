import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDecimal, IsOptional, IsPositive } from 'class-validator';
import { CreatePriceDto } from './create-price.dto';

export class UpdatePriceDto extends PartialType(CreatePriceDto) {
  @ApiPropertyOptional({
    description: 'The purchase price of the product',
    example: 110.5,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Purchase price must be positive' })
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({
    description: 'The selling price of the product',
    example: 165.25,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsPositive({ message: 'Selling price must be positive' })
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({
    description: 'Whether this is the current price for the product',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isCurrentPrice?: boolean;
}
