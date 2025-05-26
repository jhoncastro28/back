import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../dto/inventory-movement.types';

export class ProductEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Samsung Galaxy S21' })
  name: string;

  @ApiPropertyOptional({ example: 'Smartphone with 6.2-inch screen' })
  description?: string;

  @ApiProperty({ example: 10 })
  currentStock: number;
}

export class SupplierEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Samsung Electronics' })
  name: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  contactName?: string;
}

export class UserEntity {
  @ApiProperty({ example: 'abc123' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;
}

export class SaleEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2023-05-15T14:30:00Z' })
  saleDate: Date;

  @ApiProperty({ example: 1500.0 })
  totalAmount: number;
}

export class InventoryMovementEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRY })
  type: MovementType;

  @ApiProperty({ example: 5 })
  quantity: number;

  @ApiPropertyOptional({ example: 'Regular stock replenishment' })
  reason?: string;

  @ApiPropertyOptional({ example: 'Received in good condition' })
  notes?: string;

  @ApiProperty({ example: '2023-05-15T10:30:00Z' })
  movementDate: Date;

  @ApiProperty()
  product: ProductEntity;

  @ApiPropertyOptional()
  supplier?: SupplierEntity;

  @ApiProperty()
  user: UserEntity;

  @ApiPropertyOptional()
  sale?: SaleEntity;

  @ApiProperty({ example: '2023-05-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-05-15T10:30:00Z' })
  updatedAt: Date;
}

export class InventoryMovementResponseEntity {
  @ApiProperty()
  data: InventoryMovementEntity;

  @ApiProperty({ example: 'Inventory movement created successfully' })
  message: string;
}

export class PaginatedInventoryMovementsResponseEntity {
  @ApiProperty({ type: [InventoryMovementEntity] })
  data: InventoryMovementEntity[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: false,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  @ApiProperty({ example: 'Inventory movements retrieved successfully' })
  message: string;
}
