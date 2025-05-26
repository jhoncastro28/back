import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  MOVEMENT_CONSTANTS,
  MovementReason,
  MovementStatus,
  MovementType,
} from './inventory-movement.types';

/**
 * Data Transfer Object for creating a new inventory movement
 *
 * @example
 * {
 *   "type": "ENTRY",
 *   "reason": "PURCHASE",
 *   "quantity": 100,
 *   "unitPrice": 25.99,
 *   "productId": 1,
 *   "supplierId": 1,
 *   "notes": "Regular stock replenishment",
 *   "status": "PENDING"
 * }
 */
export class CreateInventoryMovementDto {
  @ApiProperty({
    description: 'Type of inventory movement',
    enum: MovementType,
    example: MovementType.ENTRY,
  })
  @IsNotEmpty({ message: 'Movement type is required' })
  @IsEnum(MovementType, {
    message: `Type must be either ${MovementType.ENTRY} or ${MovementType.EXIT}`,
  })
  type: MovementType;

  @ApiProperty({
    description: 'Reason for the movement',
    enum: MovementReason,
    example: MovementReason.PURCHASE,
  })
  @IsNotEmpty({ message: 'Movement reason is required' })
  @IsEnum(MovementReason, {
    message: 'Invalid movement reason',
  })
  reason: MovementReason;

  @ApiProperty({
    description: 'Quantity of products being moved',
    example: 100,
    minimum: MOVEMENT_CONSTANTS.MIN_QUANTITY,
    maximum: MOVEMENT_CONSTANTS.MAX_QUANTITY,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(MOVEMENT_CONSTANTS.MIN_QUANTITY, {
    message: `Quantity must be at least ${MOVEMENT_CONSTANTS.MIN_QUANTITY}`,
  })
  @Max(MOVEMENT_CONSTANTS.MAX_QUANTITY, {
    message: `Quantity cannot exceed ${MOVEMENT_CONSTANTS.MAX_QUANTITY}`,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Unit price of the product (required for PURCHASE movements)',
    example: 25.99,
    minimum: MOVEMENT_CONSTANTS.MIN_UNIT_PRICE,
    maximum: MOVEMENT_CONSTANTS.MAX_UNIT_PRICE,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(MOVEMENT_CONSTANTS.MIN_UNIT_PRICE, {
    message: `Unit price must be at least ${MOVEMENT_CONSTANTS.MIN_UNIT_PRICE}`,
  })
  @Max(MOVEMENT_CONSTANTS.MAX_UNIT_PRICE, {
    message: `Unit price cannot exceed ${MOVEMENT_CONSTANTS.MAX_UNIT_PRICE}`,
  })
  @ValidateIf((o) => o.reason === MovementReason.PURCHASE)
  @IsNotEmpty({ message: 'Unit price is required for purchase movements' })
  unitPrice?: number;

  @ApiProperty({
    description: 'Product ID that is being moved',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Product ID must be an integer' })
  @IsPositive({ message: 'Product ID must be positive' })
  productId: number;

  @ApiPropertyOptional({
    description: 'Supplier ID (required for PURCHASE movements)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Supplier ID must be an integer' })
  @IsPositive({ message: 'Supplier ID must be positive' })
  @ValidateIf((o) => o.reason === MovementReason.PURCHASE)
  @IsNotEmpty({ message: 'Supplier ID is required for purchase movements' })
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Sale ID (required for SALE movements)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Sale ID must be an integer' })
  @IsPositive({ message: 'Sale ID must be positive' })
  @ValidateIf((o) => o.reason === MovementReason.SALE)
  @IsNotEmpty({ message: 'Sale ID is required for sale movements' })
  saleId?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the movement',
    example: 'Regular stock replenishment',
    maxLength: MOVEMENT_CONSTANTS.NOTES_MAX_LENGTH,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(MOVEMENT_CONSTANTS.NOTES_MAX_LENGTH, {
    message: `Notes cannot exceed ${MOVEMENT_CONSTANTS.NOTES_MAX_LENGTH} characters`,
  })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Status of the movement',
    enum: MovementStatus,
    example: MovementStatus.PENDING,
    default: MovementStatus.PENDING,
  })
  @IsEnum(MovementStatus, {
    message: 'Invalid movement status',
  })
  @IsOptional()
  status?: MovementStatus = MovementStatus.PENDING;
}
