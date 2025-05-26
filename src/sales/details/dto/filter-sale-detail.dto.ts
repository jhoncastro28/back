import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class FilterSaleDetailDto {
  @ApiPropertyOptional({
    description: 'Filter by sale ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  saleId?: number;

  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}
