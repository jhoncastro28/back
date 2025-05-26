import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResult } from '../../../common/interfaces';
import { PaginationMeta } from '../../../common/interfaces/pagination.interface';

export class SaleDetailResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  saleId: number;

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

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

export class PaginatedSaleDetailResponse
  implements PaginatedResult<SaleDetailResponse>
{
  @ApiProperty({ type: [SaleDetailResponse] })
  data: SaleDetailResponse[];

  @ApiProperty()
  meta: PaginationMeta;

  @ApiProperty({ example: 'Sale details retrieved successfully' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;
}
