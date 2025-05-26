import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import {
  ClientSalesReport,
  DateSalesReport,
  ProductSalesReport,
  SalesReportItem,
  SalesReportResponse,
  SalesSummaryResponse,
} from '../entities/sales-report.entity';

@Injectable()
export class SalesReportTransformer {
  toSalesSummary(data: {
    totalSales: number;
    totalAmount: number | Decimal;
    totalItems: number;
    averageAmount: number;
    averageItemsPerSale: number;
  }): SalesSummaryResponse {
    return {
      totalSales: data.totalSales,
      totalAmount: Number(data.totalAmount),
      totalItems: data.totalItems,
      averageAmount: data.averageAmount,
      averageItemsPerSale: data.averageItemsPerSale,
    };
  }

  toProductSalesReport(data: {
    productId: number;
    productName: string;
    totalQuantity: number;
    totalAmount: number;
    salesCount: number;
  }): ProductSalesReport {
    return {
      productId: data.productId.toString(),
      productName: String(data.productName),
      totalQuantity: data.totalQuantity,
      totalAmount: Number(data.totalAmount),
      salesCount: data.salesCount,
    };
  }

  toClientSalesReport(data: {
    customerId: string;
    customerName: string;
    totalAmount: number;
    salesCount: number;
    itemsCount: number;
  }): ClientSalesReport {
    return {
      customerId: data.customerId,
      customerName: String(data.customerName),
      totalAmount: Number(data.totalAmount),
      salesCount: data.salesCount,
      itemsCount: data.itemsCount,
    };
  }

  toDateSalesReport(data: {
    date: string | Date;
    totalAmount: number;
    salesCount: number;
    itemsCount: number;
  }): DateSalesReport {
    return {
      date: String(data.date),
      totalAmount: Number(data.totalAmount),
      salesCount: data.salesCount,
      itemsCount: data.itemsCount,
    };
  }

  toProductSalesReports(data: any[]): ProductSalesReport[] {
    return data.map((item) => this.toProductSalesReport(item));
  }

  toClientSalesReports(data: any[]): ClientSalesReport[] {
    return data.map((item) => this.toClientSalesReport(item));
  }

  toDateSalesReports(data: any[]): DateSalesReport[] {
    return data.map((item) => this.toDateSalesReport(item));
  }

  toSaleDetailResponse(data: {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }): SalesReportItem {
    return {
      productId: data.productId.toString(),
      productName: data.productName,
      quantity: data.quantity,
      unitPrice: Number(data.unitPrice),
      totalPrice: Number(data.subtotal),
    };
  }

  toSalesReport(data: {
    id: number;
    saleDate: Date;
    customerName: string;
    sellerName: string;
    totalAmount: number;
    saleDetails: {
      id: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
  }): SalesReportResponse {
    return {
      saleId: data.id.toString(),
      saleDate: data.saleDate,
      customerName: data.customerName,
      sellerName: data.sellerName,
      totalAmount: Number(data.totalAmount),
      itemCount: data.saleDetails.length,
      items: data.saleDetails.map((item) => this.toSaleDetailResponse(item)),
    };
  }
}
