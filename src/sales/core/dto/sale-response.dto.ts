import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResult } from '../../../common/interfaces';
import { PaginationMeta } from '../../../common/interfaces/pagination.interface';

export class SaleDetailResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Product Name' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 100.0 })
  unitPrice: number;

  @ApiProperty({ example: 200.0 })
  subtotal: number;
}

export class SaleResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  saleDate: Date;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({
    example: {
      id: 1,
      name: 'Client Name',
      email: 'client@example.com',
    },
  })
  client: {
    id: number;
    name: string;
    email: string;
  };

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({
    example: {
      id: 1,
      name: 'User Name',
      email: 'user@example.com',
    },
  })
  user: {
    id: number;
    name: string;
    email: string;
  };

  @ApiProperty({ example: 200.0 })
  totalAmount: number;

  @ApiProperty({ type: [SaleDetailResponse] })
  details: SaleDetailResponse[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedSaleResponse implements PaginatedResult<SaleResponse> {
  @ApiProperty({ type: [SaleResponse] })
  data: SaleResponse[];

  @ApiProperty()
  meta: PaginationMeta;

  @ApiProperty({ example: 'Sales retrieved successfully' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;
}
