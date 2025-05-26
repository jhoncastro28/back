import { Injectable } from '@nestjs/common';
import { MovementType } from '../dto/movements-report-query.dto';
import {
  InventoryMovementsReportResponse,
  InventoryReportResponse,
  InventorySummaryResponse,
} from '../entities/inventory-report.entity';

interface InventoryReportData {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  totalValue: number;
  category: string;
  lastMovement: Date;
}

interface InventoryMovementData {
  movementId: string;
  productId: string;
  productName: string;
  quantity: number;
  type: MovementType;
  date: Date;
  userId: string;
  userName: string;
  reason: string;
}

interface InventorySummaryData {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overStockCount: number;
  averageValue: number;
}

@Injectable()
export class InventoryReportTransformer {
  toInventoryReport(data: InventoryReportData): InventoryReportResponse {
    const report = new InventoryReportResponse();
    report.productId = data.productId;
    report.productName = data.productName;
    report.currentStock = data.currentStock;
    report.minStock = data.minStock;
    report.maxStock = data.maxStock;
    report.unitPrice = data.unitPrice;
    report.totalValue = data.totalValue;
    report.category = data.category;
    report.lastMovement = data.lastMovement;
    return report;
  }

  toInventoryMovementsReport(
    data: InventoryMovementData,
  ): InventoryMovementsReportResponse {
    const report = new InventoryMovementsReportResponse();
    report.movementId = data.movementId;
    report.productId = data.productId;
    report.productName = data.productName;
    report.quantity = data.quantity;
    report.type = data.type;
    report.date = data.date;
    report.userId = data.userId;
    report.userName = data.userName;
    report.reason = data.reason;
    return report;
  }

  toInventorySummary(data: InventorySummaryData): InventorySummaryResponse {
    const summary = new InventorySummaryResponse();
    summary.totalProducts = data.totalProducts;
    summary.totalValue = data.totalValue;
    summary.lowStockCount = data.lowStockCount;
    summary.outOfStockCount = data.outOfStockCount;
    summary.overStockCount = data.overStockCount;
    summary.averageValue = data.averageValue;
    return summary;
  }
}
