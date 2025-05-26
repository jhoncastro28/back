import { Injectable } from '@nestjs/common';
import { Prisma, Sale, SaleDetail } from '../../../generated/prisma';
import {
  FullResponse,
  PaginatedResponse,
} from '../../common/interfaces/response.interface';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GroupByPeriod,
  SalesReportQueryDto,
} from './dto/sales-report-query.dto';
import {
  ClientSalesReport,
  DateSalesReport,
  ProductSalesReport,
  SalesReportResponse,
  SalesSummaryResponse,
} from './entities/sales-report.entity';
import { SalesReportTransformer } from './transformers/sales-report.transformer';

/**
 * Service responsible for generating various sales reports
 * Provides functionality for sales analysis and statistics
 */
@Injectable()
export class SalesReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly transformer: SalesReportTransformer,
  ) {}

  /**
   * Builds the where clause for sales report queries
   */
  private buildSalesWhereClause(
    query: Partial<SalesReportQueryDto>,
  ): Prisma.SaleWhereInput {
    const { startDate, endDate, productId, customerId, sellerId } = query;
    return {
      ...(startDate && { saleDate: { gte: startDate } }),
      ...(endDate && { saleDate: { lte: endDate } }),
      ...(productId && {
        saleDetails: {
          some: {
            productId,
          },
        },
      }),
      ...(customerId && { clientId: customerId }),
      ...(sellerId && { userId: sellerId }),
    };
  }

  private transformSaleDetail(
    detail: SaleDetail & { product: { name: string } },
  ): {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  } {
    return {
      id: detail.id,
      productId: detail.productId,
      productName: detail.product.name,
      quantity: detail.quantity,
      unitPrice: Number(detail.unitPrice),
      subtotal: Number(detail.subtotal),
    };
  }

  private transformSale(
    sale: Sale & {
      client: { name: string };
      user: { firstName: string; lastName: string };
      saleDetails: (SaleDetail & { product: { name: string } })[];
    },
  ): Parameters<SalesReportTransformer['toSalesReport']>[0] {
    return {
      id: sale.id,
      saleDate: sale.saleDate,
      customerName: sale.client.name,
      sellerName: `${sale.user.firstName} ${sale.user.lastName}`,
      totalAmount: Number(sale.totalAmount),
      saleDetails: sale.saleDetails.map(this.transformSaleDetail),
    };
  }

  /**
   * Generates a paginated sales report
   */
  async getPaginatedSalesReport(
    query: SalesReportQueryDto,
  ): Promise<PaginatedResponse<SalesReportResponse>> {
    const where = this.buildSalesWhereClause(query);
    const { page = 1, limit = 10 } = query;

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          client: true,
          user: true,
          saleDetails: {
            include: {
              product: true,
            },
          },
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
        orderBy: { saleDate: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    const data = sales.map((sale) =>
      this.transformer.toSalesReport(this.transformSale(sale)),
    );

    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Sales report generated successfully',
    );
  }

  /**
   * Generates a full sales report without pagination
   */
  async getFullSalesReport(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<SalesReportResponse>> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        client: true,
        user: true,
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { saleDate: 'desc' },
    });

    const data = sales.map((sale) =>
      this.transformer.toSalesReport(this.transformSale(sale)),
    );

    return {
      data,
      total: data.length,
      success: true,
      message: 'Full sales report generated successfully',
    };
  }

  /**
   * Generates a summary of sales statistics
   */
  async getSalesSummary(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<SalesSummaryResponse> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        saleDetails: true,
      },
    });

    const totalSales = sales.length;
    const totalAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const totalItems = sales.reduce(
      (sum, sale) => sum + sale.saleDetails.length,
      0,
    );

    return this.transformer.toSalesSummary({
      totalSales,
      totalAmount,
      totalItems,
      averageAmount: totalSales > 0 ? totalAmount / totalSales : 0,
      averageItemsPerSale: totalSales > 0 ? totalItems / totalSales : 0,
    });
  }

  /**
   * Gets sales data grouped by product
   */
  async getSalesByProduct(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<ProductSalesReport[]> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
    });

    const productMap = new Map<
      number,
      {
        productId: number;
        productName: string;
        totalQuantity: number;
        totalAmount: number;
        salesCount: number;
      }
    >();

    sales.forEach((sale) => {
      sale.saleDetails.forEach((detail) => {
        const current = productMap.get(detail.productId) || {
          productId: detail.productId,
          productName: detail.product.name,
          totalQuantity: 0,
          totalAmount: 0,
          salesCount: 0,
        };

        current.totalQuantity += detail.quantity;
        current.totalAmount += Number(detail.subtotal);
        current.salesCount++;

        productMap.set(detail.productId, current);
      });
    });

    return Array.from(productMap.values()).map((product) =>
      this.transformer.toProductSalesReport(product),
    );
  }

  /**
   * Gets sales data grouped by client
   */
  async getSalesByClient(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<ClientSalesReport[]> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        client: true,
        saleDetails: true,
      },
    });

    const clientMap = new Map<
      number,
      {
        customerId: string;
        customerName: string;
        totalAmount: number;
        salesCount: number;
        itemsCount: number;
      }
    >();

    sales.forEach((sale) => {
      const current = clientMap.get(sale.clientId) || {
        customerId: sale.clientId.toString(),
        customerName: sale.client.name,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      clientMap.set(sale.clientId, current);
    });

    return Array.from(clientMap.values()).map((client) =>
      this.transformer.toClientSalesReport(client),
    );
  }

  /**
   * Gets sales data grouped by date
   */
  async getSalesByDate(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<DateSalesReport[]> {
    const where = this.buildSalesWhereClause(query);
    const { groupBy = GroupByPeriod.DAY } = query;

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        saleDetails: true,
      },
      orderBy: { saleDate: 'asc' },
    });

    const dateMap = new Map<
      string,
      {
        date: string;
        totalAmount: number;
        salesCount: number;
        itemsCount: number;
      }
    >();

    sales.forEach((sale) => {
      const date = new Date(sale.saleDate);
      let key: string;

      switch (groupBy) {
        case GroupByPeriod.WEEK:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case GroupByPeriod.MONTH:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const current = dateMap.get(key) || {
        date: key,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      dateMap.set(key, current);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((dateReport) => this.transformer.toDateSalesReport(dateReport));
  }

  /**
   * Gets paginated sales data grouped by product
   */
  async getPaginatedSalesByProduct(
    query: SalesReportQueryDto,
  ): Promise<PaginatedResponse<ProductSalesReport>> {
    const where = this.buildSalesWhereClause(query);
    const { page = 1, limit = 10 } = query;

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          saleDetails: {
            include: {
              product: true,
            },
          },
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const productMap = new Map<string, ProductSalesReport>();
    items.forEach((sale) => {
      sale.saleDetails.forEach((detail) => {
        const productId = detail.productId.toString();
        const current = productMap.get(productId) || {
          productId,
          productName: detail.product.name,
          totalQuantity: 0,
          totalAmount: 0,
          salesCount: 0,
        };

        current.totalQuantity += detail.quantity;
        current.totalAmount += Number(detail.subtotal);
        current.salesCount++;

        productMap.set(productId, current);
      });
    });

    const data = Array.from(productMap.values());
    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Product sales report generated successfully',
    );
  }

  /**
   * Gets full sales data grouped by product
   */
  async getFullSalesByProduct(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<ProductSalesReport>> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
    });

    const productMap = new Map<string, ProductSalesReport>();
    sales.forEach((sale) => {
      sale.saleDetails.forEach((detail) => {
        const productId = detail.productId.toString();
        const current = productMap.get(productId) || {
          productId,
          productName: detail.product.name,
          totalQuantity: 0,
          totalAmount: 0,
          salesCount: 0,
        };

        current.totalQuantity += detail.quantity;
        current.totalAmount += Number(detail.subtotal);
        current.salesCount++;

        productMap.set(productId, current);
      });
    });

    const data = Array.from(productMap.values());
    return {
      data,
      total: data.length,
      success: true,
      message: 'Full product sales report generated successfully',
    };
  }

  /**
   * Gets paginated sales data grouped by client
   */
  async getPaginatedSalesByClient(
    query: SalesReportQueryDto,
  ): Promise<PaginatedResponse<ClientSalesReport>> {
    const where = this.buildSalesWhereClause(query);
    const { page = 1, limit = 10 } = query;

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          client: true,
          saleDetails: true,
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const clientMap = new Map<string, ClientSalesReport>();
    items.forEach((sale) => {
      const clientId = sale.clientId.toString();
      const current = clientMap.get(clientId) || {
        customerId: clientId,
        customerName: sale.client.name,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      clientMap.set(clientId, current);
    });

    const data = Array.from(clientMap.values());
    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Client sales report generated successfully',
    );
  }

  /**
   * Gets full sales data grouped by client
   */
  async getFullSalesByClient(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<ClientSalesReport>> {
    const where = this.buildSalesWhereClause(query);

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        client: true,
        saleDetails: true,
      },
    });

    const clientMap = new Map<string, ClientSalesReport>();
    sales.forEach((sale) => {
      const clientId = sale.clientId.toString();
      const current = clientMap.get(clientId) || {
        customerId: clientId,
        customerName: sale.client.name,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      clientMap.set(clientId, current);
    });

    const data = Array.from(clientMap.values());
    return {
      data,
      total: data.length,
      success: true,
      message: 'Full client sales report generated successfully',
    };
  }

  /**
   * Gets paginated sales data grouped by date
   */
  async getPaginatedSalesByDate(
    query: SalesReportQueryDto,
  ): Promise<PaginatedResponse<DateSalesReport>> {
    const where = this.buildSalesWhereClause(query);
    const { page = 1, limit = 10, groupBy = GroupByPeriod.DAY } = query;

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          saleDetails: true,
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const dateMap = new Map<string, DateSalesReport>();
    items.forEach((sale) => {
      const date = new Date(sale.saleDate);
      let key: string;

      switch (groupBy) {
        case GroupByPeriod.WEEK:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case GroupByPeriod.MONTH:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const current = dateMap.get(key) || {
        date: key,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      dateMap.set(key, current);
    });

    const data = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Date sales report generated successfully',
    );
  }

  /**
   * Gets full sales data grouped by date
   */
  async getFullSalesByDate(
    query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<DateSalesReport>> {
    const where = this.buildSalesWhereClause(query);
    const { groupBy = GroupByPeriod.DAY } = query;

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        saleDetails: true,
      },
      orderBy: { saleDate: 'asc' },
    });

    const dateMap = new Map<string, DateSalesReport>();
    sales.forEach((sale) => {
      const date = new Date(sale.saleDate);
      let key: string;

      switch (groupBy) {
        case GroupByPeriod.WEEK:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case GroupByPeriod.MONTH:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      const current = dateMap.get(key) || {
        date: key,
        totalAmount: 0,
        salesCount: 0,
        itemsCount: 0,
      };

      current.totalAmount += Number(sale.totalAmount);
      current.salesCount++;
      current.itemsCount += sale.saleDetails.length;

      dateMap.set(key, current);
    });

    const data = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      data,
      total: data.length,
      success: true,
      message: 'Full date sales report generated successfully',
    };
  }
}
