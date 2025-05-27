import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MovementType } from './create-inventory-movement.dto';

export class FilterInventoryMovementDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by movement type (ENTRY or EXIT)',
    enum: MovementType,
  })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by supplier ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filter by sale ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  saleId?: number;

  @ApiPropertyOptional({
    description: 'Filter by date range (from)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter by date range (to)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by movement reason (partial match)',
    example: 'replenishment',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
