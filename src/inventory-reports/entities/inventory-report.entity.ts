import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../dto/movements-report-query.dto';

export class InventoryReportResponse {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Current stock quantity' })
  currentStock: number;

  @ApiProperty({ description: 'Minimum stock quantity' })
  minStock: number;

  @ApiProperty({ description: 'Maximum stock quantity' })
  maxStock: number;

  @ApiProperty({ description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ description: 'Total value (currentStock * unitPrice)' })
  totalValue: number;

  @ApiProperty({ description: 'Product category' })
  category: string;

  @ApiProperty({ description: 'Last movement date' })
  lastMovement: Date;
}

export class InventoryMovementsReportResponse {
  @ApiProperty({ description: 'Movement ID' })
  movementId: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Movement quantity' })
  quantity: number;

  @ApiProperty({
    description: 'Movement type (ENTRY/EXIT)',
    enum: MovementType,
  })
  type: MovementType;

  @ApiProperty({ description: 'Movement date' })
  date: Date;

  @ApiProperty({ description: 'User ID who performed the movement' })
  userId: string;

  @ApiProperty({ description: 'User name who performed the movement' })
  userName: string;

  @ApiProperty({ description: 'Movement reason' })
  reason: string;
}

export class InventorySummaryResponse {
  @ApiProperty({ description: 'Total number of products' })
  totalProducts: number;

  @ApiProperty({ description: 'Total inventory value' })
  totalValue: number;

  @ApiProperty({ description: 'Number of products with low stock' })
  lowStockCount: number;

  @ApiProperty({ description: 'Number of products out of stock' })
  outOfStockCount: number;

  @ApiProperty({ description: 'Number of products with over stock' })
  overStockCount: number;

  @ApiProperty({ description: 'Average value per product' })
  averageValue: number;
}
