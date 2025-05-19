import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class SalesReportService {
  constructor(private prisma: PrismaService) {}

  async getSalesSummary(startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get total sales and revenue
    const totalSales = await this.prisma.sale.count({
      where: dateFilter,
    });

    const totalRevenue = await this.prisma.sale.aggregate({
      where: dateFilter,
      _sum: {
        totalAmount: true,
      },
    });

    // Get product count and average sale value
    const productsSold = await this.prisma.saleDetail.aggregate({
      where: {
        sale: dateFilter,
      },
      _sum: {
        quantity: true,
      },
    });

    const averageSaleValue =
      totalSales > 0
        ? Number(totalRevenue._sum?.totalAmount || 0) / totalSales
        : 0;

    // Get client count (unique clients who made purchases in the period)
    const uniqueClients = await this.prisma.sale.groupBy({
      by: ['clientId'],
      where: dateFilter,
    });

    return {
      totalSales,
      totalRevenue: totalRevenue._sum?.totalAmount || 0,
      productsSold: productsSold._sum?.quantity || 0,
      averageSaleValue,
      uniqueClients: uniqueClients.length,
      period: {
        startDate: startDate || (await this.getFirstSaleDate()),
        endDate: endDate || new Date(),
      },
    };
  }

  async getSalesByProduct(
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ) {
    // Group sales by product and calculate total quantity and revenue
    const productSales = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.id as "productId", 
        p.name as "productName", 
        SUM(sd.quantity) as "totalQuantity", 
        SUM(sd.subtotal) as "totalRevenue"
      FROM "SaleDetail" sd
      JOIN "Product" p ON sd.productId = p.id
      JOIN "Sale" s ON sd.saleId = s.id
      WHERE s."saleDate" >= ${startDate || new Date(0)} 
        AND s."saleDate" <= ${endDate || new Date()}
      GROUP BY p.id, p.name
      ORDER BY "totalRevenue" DESC
      LIMIT ${limit}
    `;

    return productSales.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantity: parseInt(item.totalQuantity),
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  async getSalesByClient(startDate?: Date, endDate?: Date, limit: number = 10) {
    // Group sales by client and calculate total quantity and revenue
    const clientSales = await this.prisma.$queryRaw<any[]>`
      SELECT 
        c.id as "clientId", 
        c.name as "clientName", 
        COUNT(DISTINCT s.id) as "totalSales", 
        SUM(s.totalAmount) as "totalSpent"
      FROM "Sale" s
      JOIN "Client" c ON s.clientId = c.id
      WHERE s."saleDate" >= ${startDate || new Date(0)} 
        AND s."saleDate" <= ${endDate || new Date()}
      GROUP BY c.id, c.name
      ORDER BY "totalSpent" DESC
      LIMIT ${limit}
    `;

    return clientSales.map((item) => ({
      clientId: item.clientId,
      clientName: item.clientName,
      totalSales: parseInt(item.totalSales),
      totalSpent: parseFloat(item.totalSpent),
    }));
  }

  async getSalesByDate(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    // Format for grouping by date
    //let dateFormat;
    let dateGrouping;

    switch (groupBy) {
      case 'day':
        //dateFormat = 'YYYY-MM-DD';
        dateGrouping = `DATE_TRUNC('day', s."saleDate")`;
        break;
      case 'week':
        //dateFormat = 'YYYY-WW';
        dateGrouping = `DATE_TRUNC('week', s."saleDate")`;
        break;
      case 'month':
        //dateFormat = 'YYYY-MM';
        dateGrouping = `DATE_TRUNC('month', s."saleDate")`;
        break;
    }

    // Group sales by date and calculate total revenue
    const salesByDate = await this.prisma.$queryRaw<any[]>`
      SELECT 
        ${dateGrouping} as "date", 
        COUNT(s.id) as "salesCount", 
        SUM(s.totalAmount) as "totalRevenue"
      FROM "Sale" s
      WHERE s."saleDate" >= ${startDate || new Date(0)} 
        AND s."saleDate" <= ${endDate || new Date()}
      GROUP BY ${dateGrouping}
      ORDER BY "date" ASC
    `;

    return salesByDate.map((item) => ({
      date: item.date,
      salesCount: parseInt(item.salesCount),
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  async getProductSalesHistory(
    productId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Build date filter
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        currentStock: true,
      },
    });

    // Get sales history for the product
    const salesHistory = await this.prisma.saleDetail.findMany({
      where: {
        productId,
        sale: dateFilter,
      },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        discountAmount: true,
        subtotal: true,
        sale: {
          select: {
            id: true,
            saleDate: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        sale: {
          saleDate: 'desc',
        },
      },
    });

    // Calculate metrics
    const totalSold = salesHistory.reduce(
      (sum, detail) => sum + detail.quantity,
      0,
    );
    const totalRevenue = salesHistory.reduce(
      (sum, detail) => sum + Number(detail.subtotal),
      0,
    );
    const averagePrice =
      salesHistory.length > 0
        ? salesHistory.reduce(
            (sum, detail) => sum + Number(detail.unitPrice),
            0,
          ) / salesHistory.length
        : 0;

    return {
      product,
      salesHistory,
      metrics: {
        totalSold,
        totalRevenue,
        averagePrice,
      },
    };
  }

  private buildDateFilter(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.SaleWhereInput {
    const filter: Prisma.SaleWhereInput = {};

    if (startDate || endDate) {
      filter.saleDate = {};

      if (startDate) {
        filter.saleDate.gte = startDate;
      }

      if (endDate) {
        filter.saleDate.lte = endDate;
      }
    }

    return filter;
  }

  private async getFirstSaleDate(): Promise<Date> {
    const firstSale = await this.prisma.sale.findFirst({
      orderBy: {
        saleDate: 'asc',
      },
      select: {
        saleDate: true,
      },
    });

    return firstSale?.saleDate || new Date();
  }
}
