import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import {
  FullResponse,
  PaginatedResponse,
} from '../common/interfaces/response.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryReportQueryDto, MovementsReportQueryDto } from './dto';
import {
  InventoryMovementsReportResponse,
  InventoryReportResponse,
  InventorySummaryResponse,
} from './entities/inventory-report.entity';
import { InventoryReportTransformer } from './transformers/inventory-report.transformer';

/**
 * Service responsible for generating various inventory-related reports
 * Provides functionality for inventory status, sales analysis, and movement tracking
 */
@Injectable()
export class InventoryReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly transformer: InventoryReportTransformer,
  ) {}

  /**
   * Builds the where clause for inventory report queries
   */
  private buildInventoryWhereClause(
    query: Partial<InventoryReportQueryDto>,
  ): Prisma.ProductWhereInput {
    const { minStock, maxStock, status, search } = query;
    return {
      ...(minStock && { currentStock: { gte: minStock } }),
      ...(maxStock && { currentStock: { lte: maxStock } }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    };
  }

  /**
   * Transforms product data into inventory report format
   */
  private transformInventoryData(items: any[]): InventoryReportResponse[] {
    return items.map((item) => {
      const currentPrice = item.prices[0];
      return this.transformer.toInventoryReport({
        productId: item.id.toString(),
        productName: item.name,
        currentStock: item.currentStock,
        minStock: item.minQuantity,
        maxStock: item.maxQuantity,
        unitPrice: currentPrice ? Number(currentPrice.sellingPrice) : 0,
        totalValue: currentPrice
          ? Number(currentPrice.sellingPrice) * item.currentStock
          : 0,
        category: item.description || 'Uncategorized',
        lastMovement: item.updatedAt,
      });
    });
  }

  /**
   * Generates a paginated inventory report
   */
  async getPaginatedInventoryReport(
    query: InventoryReportQueryDto,
  ): Promise<PaginatedResponse<InventoryReportResponse>> {
    const where = this.buildInventoryWhereClause(query);
    const { page = 1, limit = 10 } = query;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          prices: {
            where: { isCurrentPrice: true },
            take: 1,
          },
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = this.transformInventoryData(items);
    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Inventory report generated successfully',
    );
  }

  /**
   * Generates a full inventory report without pagination
   */
  async getFullInventoryReport(
    query: Omit<InventoryReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<InventoryReportResponse>> {
    const where = this.buildInventoryWhereClause(query);

    const items = await this.prisma.product.findMany({
      where,
      include: {
        prices: {
          where: { isCurrentPrice: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = this.transformInventoryData(items);
    return {
      data,
      total: data.length,
      success: true,
      message: 'Full inventory report generated successfully',
    };
  }

  /**
   * Builds the where clause for movement report queries
   */
  private buildMovementsWhereClause(
    query: Partial<MovementsReportQueryDto>,
  ): Prisma.InventoryMovementWhereInput {
    const { startDate, endDate, productId, type, userId } = query;
    return {
      ...(startDate && { movementDate: { gte: startDate } }),
      ...(endDate && { movementDate: { lte: endDate } }),
      ...(productId && { productId: parseInt(productId, 10) }),
      ...(type && { type }),
      ...(userId && { userId }),
    };
  }

  /**
   * Transforms movement data into report format
   */
  private transformMovementsData(
    items: any[],
  ): InventoryMovementsReportResponse[] {
    return items.map((item) =>
      this.transformer.toInventoryMovementsReport({
        movementId: item.id.toString(),
        productId: item.productId.toString(),
        productName: item.product.name,
        quantity: item.quantity,
        type: item.type,
        date: item.movementDate,
        userId: item.userId,
        userName: `${item.user.firstName} ${item.user.lastName}`,
        reason: item.reason || '',
      }),
    );
  }

  /**
   * Generates a paginated movements report
   */
  async getPaginatedMovementsReport(
    query: MovementsReportQueryDto,
  ): Promise<PaginatedResponse<InventoryMovementsReportResponse>> {
    const where = this.buildMovementsWhereClause(query);
    const { page = 1, limit = 10 } = query;

    const [items, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: true,
          user: true,
        },
        skip: this.paginationService.getPaginationSkip(page, limit),
        take: limit,
        orderBy: { movementDate: 'desc' },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    const data = this.transformMovementsData(items);
    return this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      'Inventory movements report generated successfully',
    );
  }

  /**
   * Generates a full movements report without pagination
   */
  async getFullMovementsReport(
    query: Omit<MovementsReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<InventoryMovementsReportResponse>> {
    const where = this.buildMovementsWhereClause(query);

    const items = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        product: true,
        user: true,
      },
      orderBy: { movementDate: 'desc' },
    });

    const data = this.transformMovementsData(items);
    return {
      data,
      total: data.length,
      success: true,
      message: 'Full inventory movements report generated successfully',
    };
  }

  /**
   * Generates a summary of the current inventory status
   */
  async getInventorySummary(): Promise<InventorySummaryResponse> {
    const products = await this.prisma.product.findMany({
      include: {
        prices: {
          where: { isCurrentPrice: true },
          take: 1,
        },
      },
    });

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      const currentPrice = product.prices[0];
      return (
        sum +
        (currentPrice
          ? Number(currentPrice.sellingPrice) * product.currentStock
          : 0)
      );
    }, 0);

    const lowStockCount = products.filter(
      (p) => p.currentStock > 0 && p.currentStock < p.minQuantity,
    ).length;
    const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;
    const overStockCount = products.filter((p) =>
      p.maxQuantity ? p.currentStock > p.maxQuantity : false,
    ).length;
    const averageValue = totalProducts > 0 ? totalValue / totalProducts : 0;

    return this.transformer.toInventorySummary({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      overStockCount,
      averageValue,
    });
  }
}
