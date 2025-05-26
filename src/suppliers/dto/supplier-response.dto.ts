import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/interfaces/pagination.interface';
import { ISupplier, ISupplierResponse } from '../interfaces/supplier.interface';

export class SupplierDto implements ISupplier {
  @ApiProperty({ example: 1, description: 'Unique identifier of the supplier' })
  id: number;

  @ApiProperty({
    example: 'Tech Supplies Inc.',
    description: 'Legal name of the supplier company',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'John Smith',
    description: 'Name of the primary contact person',
  })
  contactName: string | null;

  @ApiPropertyOptional({
    example: 'contact@techsupplies.com',
    description: 'Business email address',
  })
  email: string | null;

  @ApiPropertyOptional({
    example: '+1-555-123-4567',
    description: 'Contact phone number',
  })
  phoneNumber: string | null;

  @ApiPropertyOptional({
    example: '123 Business Ave, Suite 100',
    description: 'Business address',
  })
  address: string | null;

  @ApiPropertyOptional({
    example: 'CC',
    enum: ['CC', 'TI'],
    description: 'Type of legal identification document',
  })
  documentType: 'CC' | 'TI' | null;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Legal identification number',
  })
  documentNumber: string | null;

  @ApiProperty({ example: true, description: 'Whether the supplier is active' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-03-15T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-15T10:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [Object],
    description: 'List of products supplied by this supplier',
  })
  products?: Array<{
    id: number;
    name: string;
    currentStock: number;
  }>;

  @ApiPropertyOptional({
    type: [Object],
    description: 'List of inventory movements for this supplier',
  })
  inventoryMovements?: Array<{
    id: number;
    type: 'ENTRY' | 'EXIT';
    quantity: number;
    movementDate: Date;
  }>;
}

export class SupplierResponseDto implements ISupplierResponse {
  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({
    example: 'Supplier created successfully',
    description: 'Response message',
  })
  message?: string;

  @ApiPropertyOptional({ type: SupplierDto, description: 'Supplier data' })
  data: ISupplier | null;
}

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPreviousPage: boolean;
}

export class SupplierListResponseDto implements PaginatedResponse<SupplierDto> {
  @ApiProperty({ type: [SupplierDto], description: 'List of suppliers' })
  data: SupplierDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMeta;

  @ApiProperty({
    example: 'Suppliers retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;
}
