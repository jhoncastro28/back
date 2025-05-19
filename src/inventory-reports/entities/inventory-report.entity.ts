import { ApiProperty } from '@nestjs/swagger';

export class QueryResponseEntity {
  @ApiProperty({
    description: 'SQL query to be executed on the client side',
    example: 'SELECT * FROM inventory WHERE status = "Critical"',
  })
  query: string;

  @ApiProperty({
    description: 'Parameters for the query',
    example: { status: 'Critical', minStock: 10 },
  })
  params?: Record<string, any>;

  @ApiProperty({
    description: 'Metadata for client processing',
    example: {
      reportType: 'critical',
      format: 'xlsx',
      timestamp: '2025-05-12T10:30:00Z',
      reportTitle: 'Critical Inventory Report',
    },
  })
  metadata?: Record<string, any>;
}

export class ReportResponse {
  @ApiProperty({
    description: 'URL to download the generated report',
    example: '/reports/inventory-report-2025-05-12.xlsx',
  })
  reportUrl: string;

  @ApiProperty({
    description: 'Filename of the generated report',
    example: 'inventory-report-2025-05-12.xlsx',
  })
  filename: string;

  @ApiProperty({
    description: 'Report generation timestamp',
    example: '2025-05-12T10:30:00Z',
  })
  generatedAt: string;
}

export class InventoryItemResponse {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Product name',
    example: 'Product XYZ',
  })
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High quality product',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Current stock level',
    example: 42,
  })
  currentStock: number;

  @ApiProperty({
    description: 'Minimum required stock level',
    example: 10,
  })
  minQuantity: number;

  @ApiProperty({
    description: 'Maximum stock capacity',
    example: 100,
    required: false,
  })
  maxQuantity?: number;

  @ApiProperty({
    description: 'Supplier name',
    example: 'ABC Supplier',
  })
  supplierName: string;

  @ApiProperty({
    description: 'Current purchase price',
    example: 15.5,
  })
  purchasePrice: number;

  @ApiProperty({
    description: 'Current selling price',
    example: 25.99,
  })
  sellingPrice: number;

  @ApiProperty({
    description: 'Stock status',
    example: 'Normal',
    enum: ['Critical', 'Low', 'Normal', 'High'],
  })
  status: string;
}

export class InventoryReportResponse {
  @ApiProperty({
    description: 'List of inventory items',
    type: [InventoryItemResponse],
  })
  items: InventoryItemResponse[];

  @ApiProperty({
    description: 'Total number of products',
    example: 120,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Total value of inventory (purchase price)',
    example: 15750.25,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Number of critical stock items',
    example: 5,
  })
  criticalItems: number;

  @ApiProperty({
    description: 'Report generation timestamp',
    example: '2025-05-12T10:30:00Z',
  })
  generatedAt: string;
}
