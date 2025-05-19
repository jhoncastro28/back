import { Injectable } from '@nestjs/common';
import { GenerateReportDto, ReportType } from './dto/inventory-report.dto';
import { QueryParamsDto } from './dto/query-params.dto';

@Injectable()
export class InventoryReportsService {
  async generateReportQuery(
    generateReportDto: GenerateReportDto,
  ): Promise<QueryParamsDto> {
    const { reportType, supplierId, startDate, endDate, format } =
      generateReportDto;

    // Base query for inventory data
    let query = `
      SELECT 
        p.id, 
        p.name, S
        p.description, 
        p.currentStock, 
        p.minQuantity, 
        p.maxQuantity, 
        s.name as supplierName, 
        pr.purchasePrice, 
        pr.sellingPrice,
        CASE 
          WHEN p.currentStock <= p.minQuantity THEN 'Critical'
          WHEN p.currentStock <= p.minQuantity * 1.5 THEN 'Low'
          WHEN p.maxQuantity IS NOT NULL AND p.currentStock >= p.maxQuantity * 0.9 THEN 'High'
          ELSE 'Normal'
        END as status
      FROM products p
      JOIN suppliers s ON p.supplierId = s.id
      JOIN prices pr ON p.id = pr.productId AND pr.isCurrentPrice = true
      WHERE p.isActive = true
    `;

    // Build query parameters
    const params: Record<string, any> = {};

    // Add filters based on report type
    if (reportType === ReportType.CRITICAL) {
      query += ' AND p.currentStock <= p.minQuantity';
    }

    // Add supplier filter if provided
    if (supplierId) {
      query += ' AND p.supplierId = :supplierId';
      params.supplierId = parseInt(supplierId, 10);
    }

    // Add date filters if needed
    if (startDate) {
      query += ' AND p.updatedAt >= :startDate';
      params.startDate = startDate;
    }

    if (endDate) {
      query += ' AND p.updatedAt <= :endDate';
      params.endDate = endDate;
    }

    // Order by status (critical first) and then by name
    query +=
      " ORDER BY CASE WHEN status = 'Critical' THEN 1 WHEN status = 'Low' THEN 2 ELSE 3 END, p.name";

    // Return query and parameters
    return {
      query,
      params,
      metadata: {
        reportType,
        format,
        timestamp: new Date().toISOString(),
        reportTitle: this.getReportTitle(reportType),
      },
    };
  }

  async getInventorySummaryQuery(): Promise<QueryParamsDto> {
    // Query for count of all products
    const totalProductsQuery = `
      SELECT COUNT(*) as totalProducts 
      FROM products
      WHERE isActive = true
    `;

    // Query for total inventory value
    const totalValueQuery = `
      SELECT SUM(p.currentStock * pr.purchasePrice) as totalValue
      FROM products p
      JOIN prices pr ON p.id = pr.productId AND pr.isCurrentPrice = true
      WHERE p.isActive = true
    `;

    // Query for critical items count
    const criticalItemsQuery = `
      SELECT COUNT(*) as criticalItems
      FROM products
      WHERE isActive = true AND currentStock <= minQuantity
    `;

    // Combined query with SQLite's compound queries
    const combinedQuery = `
      ${totalProductsQuery};
      ${totalValueQuery};
      ${criticalItemsQuery};
    `;

    return {
      query: combinedQuery,
      metadata: {
        queryType: 'summary',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private getReportTitle(reportType: ReportType): string {
    switch (reportType) {
      case ReportType.GENERAL:
        return 'General Inventory Report';
      case ReportType.BY_CATEGORY:
        return 'Inventory Report by Category';
      case ReportType.CRITICAL:
        return 'Critical Inventory Report';
      default:
        return 'Inventory Report';
    }
  }
}
