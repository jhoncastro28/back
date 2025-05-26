import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../common/interfaces/pagination.interface';
import {
  ISale,
  ISaleDetail,
  ITopPerformer,
  ITopPerformers,
} from '../interfaces/sales-report.interface';

/**
 * Represents a sales report item
 */
export class SalesReportItem {
  @ApiProperty({ example: '1', description: 'Product ID' })
  productId: string;

  @ApiProperty({ example: 'Laptop', description: 'Product name' })
  productName: string;

  @ApiProperty({ example: 2, description: 'Quantity sold' })
  quantity: number;

  @ApiProperty({ example: 999.99, description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ example: 1999.98, description: 'Total price' })
  totalPrice: number;
}

/**
 * Represents a complete sales report entry
 */
export class SalesReportResponse {
  @ApiProperty({ example: '1', description: 'Sale ID' })
  saleId: string;

  @ApiProperty({ example: '2024-01-01', description: 'Sale date' })
  saleDate: Date;

  @ApiProperty({ example: 'John Doe', description: 'Customer name' })
  customerName: string;

  @ApiProperty({ example: 'Jane Smith', description: 'Seller name' })
  sellerName: string;

  @ApiProperty({ example: 1999.98, description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ example: 2, description: 'Number of items' })
  itemCount: number;

  @ApiProperty({ type: [SalesReportItem], description: 'List of items sold' })
  items: SalesReportItem[];
}

/**
 * Represents sales summary statistics
 */
export class SalesSummaryResponse {
  @ApiProperty({ example: 100, description: 'Total number of sales' })
  totalSales: number;

  @ApiProperty({ example: 99999.99, description: 'Total amount of sales' })
  totalAmount: number;

  @ApiProperty({ example: 150, description: 'Total number of items sold' })
  totalItems: number;

  @ApiProperty({ example: 999.99, description: 'Average amount per sale' })
  averageAmount: number;

  @ApiProperty({ example: 1.5, description: 'Average items per sale' })
  averageItemsPerSale: number;
}

/**
 * Represents sales data grouped by product
 */
export class ProductSalesReport {
  @ApiProperty({ example: '1', description: 'Product ID' })
  productId: string;

  @ApiProperty({ example: 'Laptop', description: 'Product name' })
  productName: string;

  @ApiProperty({ example: 50, description: 'Total quantity sold' })
  totalQuantity: number;

  @ApiProperty({ example: 49999.5, description: 'Total amount of sales' })
  totalAmount: number;

  @ApiProperty({ example: 25, description: 'Number of sales' })
  salesCount: number;
}

/**
 * Represents sales data grouped by client
 */
export class ClientSalesReport {
  @ApiProperty({ example: '1', description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer name' })
  customerName: string;

  @ApiProperty({ example: 9999.99, description: 'Total amount spent' })
  totalAmount: number;

  @ApiProperty({ example: 10, description: 'Number of sales' })
  salesCount: number;

  @ApiProperty({ example: 15, description: 'Total number of items bought' })
  itemsCount: number;
}

/**
 * Represents sales data grouped by date
 */
export class DateSalesReport {
  @ApiProperty({ example: '2024-01-01', description: 'Date of sales' })
  date: string;

  @ApiProperty({ example: 9999.99, description: 'Total amount of sales' })
  totalAmount: number;

  @ApiProperty({ example: 10, description: 'Number of sales' })
  salesCount: number;

  @ApiProperty({ example: 15, description: 'Total number of items sold' })
  itemsCount: number;
}

export class SaleDetailResponse implements ISaleDetail {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the sale detail',
  })
  id: number;

  @ApiProperty({ example: 1, description: 'ID of the product sold' })
  productId: number;

  @ApiProperty({ example: 'Product Name', description: 'Name of the product' })
  productName: string;

  @ApiProperty({ example: 5, description: 'Quantity of products sold' })
  quantity: number;

  @ApiProperty({
    example: 29.99,
    description: 'Price per unit at the time of sale',
  })
  unitPrice: number;

  @ApiProperty({
    example: 149.95,
    description: 'Total amount for this item (quantity * unitPrice)',
  })
  subtotal: number;
}

export class SaleResponse implements ISale {
  @ApiProperty({ example: 1, description: 'Unique identifier of the sale' })
  id: number;

  @ApiProperty({
    example: '2024-03-15T10:00:00Z',
    description: 'Date and time of the sale',
  })
  saleDate: Date;

  @ApiProperty({
    example: 1,
    description: 'ID of the client who made the purchase',
  })
  clientId: number;

  @ApiProperty({ example: 'John Doe', description: 'Name of the client' })
  clientName: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'ID of the user who processed the sale',
  })
  userId: string;

  @ApiProperty({
    example: 'Sales Person',
    description: 'Name of the user who processed the sale',
  })
  userName: string;

  @ApiProperty({ example: 299.99, description: 'Total amount of the sale' })
  totalAmount: number;

  @ApiProperty({
    type: [SaleDetailResponse],
    description: 'List of items in the sale',
  })
  items: SaleDetailResponse[];
}

export class TopPerformerResponse implements ITopPerformer {
  @ApiProperty({
    example: 1,
    description: 'ID of the entity (product, client, or user)',
  })
  id: number;

  @ApiProperty({ example: 'Product Name', description: 'Name of the entity' })
  name: string;

  @ApiProperty({ example: 5000, description: 'Total revenue generated' })
  totalRevenue: number;

  @ApiProperty({ example: 50, description: 'Total number of sales/items' })
  totalCount: number;

  @ApiProperty({ example: 100, description: 'Average revenue per sale/item' })
  averageRevenue: number;
}

export class TopPerformersResponse implements ITopPerformers {
  @ApiProperty({
    type: [TopPerformerResponse],
    description: 'Top performing products',
  })
  products?: TopPerformerResponse[];

  @ApiProperty({
    type: [TopPerformerResponse],
    description: 'Top performing clients',
  })
  clients?: TopPerformerResponse[];

  @ApiProperty({
    type: [TopPerformerResponse],
    description: 'Top performing users',
  })
  users?: TopPerformerResponse[];
}

export class PaginationMetaResponse implements PaginationMeta {
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

export class SaleItemResponse {
  @ApiProperty({ example: 1, description: 'Product ID' })
  productId: number;

  @ApiProperty({ example: 'Product Name', description: 'Name of the product' })
  productName: string;

  @ApiProperty({ example: 5, description: 'Quantity sold' })
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Price per unit' })
  unitPrice: number;

  @ApiProperty({ example: 149.95, description: 'Total price for this item' })
  totalPrice: number;
}
