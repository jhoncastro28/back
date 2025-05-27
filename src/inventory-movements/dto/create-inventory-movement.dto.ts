import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export class CreateInventoryMovementDto {
  @ApiProperty({
    description: 'Type of inventory movement (ENTRY or EXIT)',
    enum: MovementType,
    example: MovementType.ENTRY,
  })
  @IsNotEmpty()
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({
    description: 'Quantity of products being moved',
    example: 10,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Product ID that is being moved',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiPropertyOptional({
    description: 'Supplier ID (required for ENTRY movements)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  supplierId?: number;

  @ApiPropertyOptional({
    description: 'Sale ID (required for EXIT movements related to sales)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  saleId?: number;

  @ApiPropertyOptional({
    description: 'Reason for the inventory movement',
    example: 'Regular stock replenishment',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the movement',
    example: 'Received in good condition',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
