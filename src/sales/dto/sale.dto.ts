import {
  IsDate,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSaleDetailDto } from './sale-detail.dto';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Sale date',
    example: '2024-05-16T12:00:00Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  saleDate?: Date;

  @ApiProperty({
    description: 'Notes about the sale',
    example: 'Customer requested delivery',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Client ID', example: 1 })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  clientId: number;

  @ApiProperty({
    description: 'Sale details containing the products sold',
    type: [CreateSaleDetailDto],
  })
  @IsNotEmpty()
  details: CreateSaleDetailDto[];
}

export class UpdateSaleDto {
  @ApiProperty({
    description: 'Sale date',
    example: '2024-05-16T12:00:00Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  saleDate?: Date;

  @ApiProperty({
    description: 'Total amount of the sale',
    example: 100.5,
    required: false,
  })
  @IsDecimal()
  @IsPositive()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({
    description: 'Notes about the sale',
    example: 'Customer requested delivery',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Client ID', example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  clientId?: number;

  @ApiProperty({
    description: 'User ID of the salesperson',
    example: 'uuid-string',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class SaleResponseDto {
  id: number;
  saleDate: Date;
  totalAmount: number;
  notes?: string;
  clientId: number;
  client?: {
    id: number;
    name: string;
    email?: string;
  };
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  saleDetails?: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    subtotal: number;
    productId: number;
    product?: {
      id: number;
      name: string;
    };
  }>;
}

export class ClientPurchaseSummaryDto {
  @ApiProperty({ description: 'Total number of sales for the client' })
  totalSales: number;

  @ApiProperty({ description: 'Total amount spent by the client' })
  totalAmount: number;

  @ApiProperty({ description: 'Average amount per sale' })
  averageAmount: number;

  @ApiProperty({
    description: 'Last purchase information',
    required: false,
  })
  lastPurchase?: {
    id: number;
    saleDate: Date;
    totalAmount: number;
  };

  @ApiProperty({
    description: 'Most purchased products with quantities',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        product: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
        totalQuantity: { type: 'number' },
        timesPurchased: { type: 'number' },
      },
    },
  })
  mostPurchasedProducts: Array<{
    product: {
      id: number;
      name: string;
    };
    totalQuantity: number;
    timesPurchased: number;
  }>;
}

export class ClientResponseDto {
  @ApiProperty({ description: 'Client ID' })
  id: number;

  @ApiProperty({ description: 'Client name' })
  name: string;

  @ApiProperty({ description: 'Client email', required: false })
  email?: string;

  @ApiProperty({ description: 'Client phone number', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: 'Client document type', required: false })
  documentType?: string;

  @ApiProperty({ description: 'Client document number', required: false })
  documentNumber?: string;
}

export class ClientSalesResponseDto {
  @ApiProperty({
    description: 'Array of sales for the client',
    type: [SaleResponseDto],
  })
  data: SaleResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      pages: { type: 'number' },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  @ApiProperty({
    description: 'Summary statistics for the client',
    type: ClientPurchaseSummaryDto,
  })
  summary: ClientPurchaseSummaryDto;

  @ApiProperty({
    description: 'Client information',
    type: ClientResponseDto,
  })
  client: ClientResponseDto;
}
