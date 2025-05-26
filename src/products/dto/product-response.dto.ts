import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/interfaces';
import { PaginationMeta } from '../../common/interfaces/pagination.interface';

export class ProductResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Product Name' })
  name: string;

  @ApiProperty({ example: 'Product Description', required: false })
  description?: string;

  @ApiProperty({ example: 10 })
  minQuantity: number;

  @ApiProperty({ example: 100 })
  maxQuantity: number;

  @ApiProperty({ example: 50 })
  currentStock: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  supplierId: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @ApiProperty({
    example: {
      id: 1,
      name: 'Supplier Name',
      email: 'supplier@example.com',
    },
  })
  supplier?: {
    id: number;
    name: string;
    email: string;
  };

  @ApiProperty({
    example: [
      {
        id: 1,
        purchasePrice: 80.0,
        sellingPrice: 100.0,
        isCurrentPrice: true,
      },
    ],
  })
  prices?: {
    id: number;
    purchasePrice: number;
    sellingPrice: number;
    isCurrentPrice: boolean;
  }[];
}

export class PaginatedProductResponse
  implements PaginatedResult<ProductResponse>
{
  @ApiProperty({ type: [ProductResponse] })
  data: ProductResponse[];

  @ApiProperty()
  meta: PaginationMeta;

  @ApiProperty({ example: 'Products retrieved successfully' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;
}
