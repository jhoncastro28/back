import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/interfaces';
import { PaginationMeta } from '../../common/interfaces/pagination.interface';

export class PriceResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 100.0 })
  purchasePrice: number;

  @ApiProperty({ example: 150.0 })
  sellingPrice: number;

  @ApiProperty({ example: true })
  isCurrentPrice: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  validFrom: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  validTo?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @ApiProperty({
    example: {
      id: 1,
      name: 'Product Name',
      description: 'Product Description',
    },
  })
  product?: {
    id: number;
    name: string;
    description?: string;
  };
}

export class PaginatedPriceResponse implements PaginatedResult<PriceResponse> {
  @ApiProperty({ type: [PriceResponse] })
  data: PriceResponse[];

  @ApiProperty()
  meta: PaginationMeta;

  @ApiProperty({ example: 'Prices retrieved successfully' })
  message: string;
}
