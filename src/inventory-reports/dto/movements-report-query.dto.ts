import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

/**
 * DTO for inventory movements report query parameters
 * Used for filtering and pagination in movement report endpoints
 */
export class MovementsReportQueryDto {
  @ApiProperty({
    required: false,
    description: 'Start date for filtering movements',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    required: false,
    description: 'End date for filtering movements',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({
    required: false,
    description: 'Product ID to filter movements',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    required: false,
    enum: MovementType,
    description: 'Movement type to filter by',
    example: MovementType.ENTRY,
  })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiProperty({
    required: false,
    description: 'User ID to filter movements',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
