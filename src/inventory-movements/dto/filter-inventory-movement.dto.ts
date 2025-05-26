import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  MovementReason,
  MovementStatus,
  MovementType,
} from './inventory-movement.types';

/**
 * Data Transfer Object for filtering inventory movements
 *
 * @example
 * {
 *   "type": "ENTRY",
 *   "reason": "PURCHASE",
 *   "status": "APPROVED",
 *   "productId": 1,
 *   "supplierId": 1,
 *   "saleId": null,
 *   "dateFrom": "2024-01-01T00:00:00Z",
 *   "dateTo": "2024-12-31T23:59:59Z",
 *   "reference": "PO-2024",
 *   "page": 1,
 *   "limit": 10,
 *   "sortBy": "createdAt",
 *   "sortDirection": "desc"
 * }
 */
export class FilterInventoryMovementDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by movement type',
    enum: MovementType,
    example: MovementType.ENTRY,
  })
  @IsEnum(MovementType, {
    message: `Type must be either ${MovementType.ENTRY} or ${MovementType.EXIT}`,
  })
  @IsOptional()
  type?: MovementType;

  @ApiPropertyOptional({
    description: 'Filter by movement reason',
    enum: MovementReason,
    example: MovementReason.PURCHASE,
  })
  @IsEnum(MovementReason, {
    message: 'Invalid movement reason',
  })
  @IsOptional()
  reason?: MovementReason;

  @ApiPropertyOptional({
    description: 'Filter by movement status',
    enum: MovementStatus,
    example: MovementStatus.APPROVED,
  })
  @IsEnum(MovementStatus, {
    message: 'Invalid movement status',
  })
  @IsOptional()
  status?: MovementStatus;

  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Product ID must be an integer' })
  @IsPositive({ message: 'Product ID must be positive' })
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by supplier ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Supplier ID must be an integer' })
  @IsPositive({ message: 'Supplier ID must be positive' })
  @IsOptional()
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Filter by sale ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Sale ID must be an integer' })
  @IsPositive({ message: 'Sale ID must be positive' })
  @IsOptional()
  saleId?: number;

  @ApiPropertyOptional({
    description: 'Filter by movement date (from)',
    example: '2024-01-01T00:00:00Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'Date from must be a valid date' })
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter by movement date (to)',
    example: '2024-12-31T23:59:59Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'Date to must be a valid date' })
  @IsOptional()
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by minimum quantity',
    example: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Minimum quantity must be an integer' })
  @IsPositive({ message: 'Minimum quantity must be positive' })
  @IsOptional()
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum quantity',
    example: 1000,
  })
  @Type(() => Number)
  @IsInt({ message: 'Maximum quantity must be an integer' })
  @IsPositive({ message: 'Maximum quantity must be positive' })
  @IsOptional()
  maxQuantity?: number;
}
