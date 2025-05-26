import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxDate,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateSaleDetailDto } from '../../details/dto/sale-detail.dto';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Client ID who made the purchase',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  clientId: number;

  @ApiProperty({
    description: 'Date when the sale was made',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  @MaxDate(new Date(), { message: 'Sale date cannot be in the future' })
  saleDate: Date;

  @ApiProperty({
    description: 'List of products to be sold',
    type: [CreateSaleDetailDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one product must be included in the sale',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  details: CreateSaleDetailDto[];
}

export class UpdateSaleDto {
  @ApiPropertyOptional({
    description: 'Client ID who made the purchase',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Date when the sale was made',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @MaxDate(new Date(), { message: 'Sale date cannot be in the future' })
  saleDate?: Date;
}

export class SaleFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering sales',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for filtering sales',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Client ID for filtering sales',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
