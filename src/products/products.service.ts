import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustStockDto,
  CreateProductDto,
  FilterProductDto,
  StockAdjustmentType,
  UpdateProductDto,
} from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { purchasePrice, sellingPrice, ...productData } = createProductDto;

    // First, check if the supplier exists
    const supplierExists = await this.prisma.supplier.findUnique({
      where: { id: createProductDto.supplierId },
    });

    if (!supplierExists) {
      throw new NotFoundException(
        `Supplier with ID ${createProductDto.supplierId} not found`,
      );
    }

    // Create the product and its initial price in a transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          currentStock: 0,
        },
      });

      // Create the initial price
      await tx.price.create({
        data: {
          purchasePrice,
          sellingPrice,
          isCurrentPrice: true,
          productId: product.id,
        },
      });

      return product;
    });
  }

  async findAll(filters: FilterProductDto = {}) {
    const { name, isActive, supplierId, page = 1, limit = 10 } = filters;

    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId, 10);
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total product count for these filters
    const total = await this.prisma.product.count({ where });

    // Get paginated products
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        supplier: true,
        prices: {
          where: {
            isCurrentPrice: true,
          },
          take: 1,
        },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        prices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { purchasePrice, sellingPrice, ...productData } = updateProductDto;

    // Check if the product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If a supplier is specified, check if it exists
    if (productData.supplierId) {
      const supplierExists = await this.prisma.supplier.findUnique({
        where: { id: productData.supplierId },
      });

      if (!supplierExists) {
        throw new NotFoundException(
          `Supplier with ID ${productData.supplierId} not found`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
      });

      // If price information is provided, update prices
      if (purchasePrice !== undefined || sellingPrice !== undefined) {
        // Get the current price
        const currentPrice = await tx.price.findFirst({
          where: {
            productId: id,
            isCurrentPrice: true,
          },
        });

        // If there's a current price, mark it as not current
        if (currentPrice) {
          await tx.price.update({
            where: { id: currentPrice.id },
            data: {
              isCurrentPrice: false,
              validTo: new Date(),
            },
          });
        }

        // Create the new price
        await tx.price.create({
          data: {
            purchasePrice: purchasePrice ?? currentPrice?.purchasePrice,
            sellingPrice: sellingPrice ?? currentPrice?.sellingPrice,
            isCurrentPrice: true,
            productId: id,
          },
        });
      }

      return updatedProduct;
    });
  }

  /**
   * Deactivates a product (logical deletion)
   * Instead of physically removing records from the database, we mark them as inactive
   * This preserves historical data and relationships while preventing the product from
   * being displayed in active product listings
   */
  async deactivate(id: number): Promise<void> {
    // Check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Instead of physically deleting, mark as inactive
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get products with stock levels below their minimum quantity
   */
  async getLowStockProducts() {
    const productsWithLowStock = await this.prisma.product.findMany({
      where: {
        isActive: true,
        // Use a raw query to check if currentStock < minQuantity
        currentStock: {
          lt: this.prisma.product.fields.minQuantity,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            phoneNumber: true,
          },
        },
        prices: {
          where: {
            isCurrentPrice: true,
          },
          take: 1,
        },
      },
      orderBy: {
        // Sort by how critical the shortage is (lowest stock first)
        currentStock: 'asc',
      },
    });

    return {
      data: productsWithLowStock,
      message: 'Low stock products retrieved successfully',
    };
  }

  /**
   * Get price history for a specific product
   */
  async getPriceHistory(id: number) {
    // Check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Get all prices for this product, ordered by creation date (newest first)
    const priceHistory = await this.prisma.price.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: {
        product,
        priceHistory,
      },
      message: 'Price history retrieved successfully',
    };
  }

  /**
   * Manually adjust the stock level of a product
   * Creates an inventory movement record to track the adjustment
   */
  async adjustStock(id: number, adjustStockDto: AdjustStockDto) {
    const { type, quantity, reason, notes } = adjustStockDto;

    // Check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Calculate the actual quantity change based on adjustment type
    const stockChange =
      type === StockAdjustmentType.INCREASE ? quantity : -quantity;

    // Check for negative stock
    if (product.currentStock + stockChange < 0) {
      throw new BadRequestException(
        `Cannot decrease stock below zero. Current stock: ${product.currentStock}`,
      );
    }

    // Use a transaction to ensure both the movement and stock update succeed or fail together
    return this.prisma.$transaction(async (tx) => {
      // Update the product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          currentStock: {
            increment: stockChange,
          },
        },
      });

      // Create a manual inventory movement record to track this adjustment
      await tx.inventoryMovement.create({
        data: {
          type: type === StockAdjustmentType.INCREASE ? 'ENTRY' : 'EXIT',
          quantity,
          reason: reason || 'Manual stock adjustment',
          notes,
          productId: id,
          // Use system administrator as default for manual adjustments
          // In a real system, you would get this from the authenticated user
          userId: '1', // Replace with dynamic user ID in production
          movementDate: new Date(),
        },
      });

      return {
        data: updatedProduct,
        message: `Stock successfully ${type.toLowerCase()}d by ${quantity} units`,
      };
    });
  }

  async updateStock(id: number, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const newStock = product.currentStock + quantity;

    if (newStock < 0) {
      throw new Error(
        `Insufficient stock available for product ${product.name}`,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { currentStock: newStock },
    });
  }

  /**
   * Generate a comprehensive stock status report for all products
   * Includes alerts for products with low stock (below minQuantity) and high stock (above maxQuantity)
   */
  async generateStockStatusReport() {
    try {
      // Get all active products with their current stock information
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              phoneNumber: true,
            },
          },
          prices: {
            where: {
              isCurrentPrice: true,
            },
            take: 1,
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Categorize products by stock status
      const lowStockProducts = products.filter(
        (product) => product.currentStock < product.minQuantity,
      );

      const highStockProducts = products.filter(
        (product) =>
          product.maxQuantity !== null &&
          product.currentStock > product.maxQuantity,
      );

      const optimalStockProducts = products.filter(
        (product) =>
          product.currentStock >= product.minQuantity &&
          (product.maxQuantity === null ||
            product.currentStock <= product.maxQuantity),
      );

      // Calculate summary statistics
      const totalProducts = products.length;
      const totalStock = products.reduce(
        (sum, product) => sum + product.currentStock,
        0,
      );
      const averageStock = totalProducts > 0 ? totalStock / totalProducts : 0;

      // Calculate stock value
      let totalStockValue = 0;
      products.forEach((product) => {
        const currentPrice = product.prices[0];
        if (currentPrice) {
          totalStockValue +=
            product.currentStock * Number(currentPrice.purchasePrice);
        }
      });

      return {
        data: {
          summary: {
            totalProducts,
            totalStock,
            averageStock,
            totalStockValue,
            lowStockCount: lowStockProducts.length,
            highStockCount: highStockProducts.length,
            optimalStockCount: optimalStockProducts.length,
          },
          stockCategories: {
            lowStock: lowStockProducts,
            highStock: highStockProducts,
            optimalStock: optimalStockProducts,
          },
        },
        message: 'Stock status report generated successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error generating stock status report: ' + error.message,
      );
    }
  }

  /**
   * Generate a sales performance report for products
   * Includes top-selling products, revenue analysis, and trends
   */
  async generateSalesPerformanceReport(dateFrom?: Date, dateTo?: Date) {
    try {
      // Set default date range if not provided (last 30 days)
      const now = new Date();
      const defaultDateFrom = new Date();
      defaultDateFrom.setDate(now.getDate() - 30);

      const effectiveDateFrom = dateFrom || defaultDateFrom;
      const effectiveDateTo = dateTo || now;

      if (effectiveDateFrom > effectiveDateTo) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Get all sale items within the date range
      const saleItems = await this.prisma.saleDetail.findMany({
        where: {
          sale: {
            saleDate: {
              gte: effectiveDateFrom,
              lte: effectiveDateTo,
            },
          },
        },
        include: {
          product: true,
          sale: {
            select: {
              id: true,
              saleDate: true,
              totalAmount: true,
            },
          },
        },
      });

      // Group by product to calculate sales metrics
      const productSales: Record<
        number,
        {
          productId: number;
          name: string;
          totalQuantity: number;
          totalRevenue: number;
          averagePrice: number;
          salesCount: number;
        }
      > = {};

      saleItems.forEach((item) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            name: item.product.name,
            totalQuantity: 0,
            totalRevenue: 0,
            averagePrice: 0,
            salesCount: 0,
          };
        }

        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue +=
          Number(item.unitPrice) * item.quantity;
        productSales[productId].salesCount++;
      });

      // Calculate average price for each product
      Object.values(productSales).forEach((product) => {
        product.averagePrice =
          product.totalQuantity > 0
            ? product.totalRevenue / product.totalQuantity
            : 0;
      });

      // Convert to array for sorting
      const productsArray = Object.values(productSales);

      // Get top products by quantity sold
      const topProductsByQuantity = [...productsArray]
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      // Get top products by revenue
      const topProductsByRevenue = [...productsArray]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Calculate total revenue
      const totalRevenue = productsArray.reduce(
        (sum, product) => sum + product.totalRevenue,
        0,
      );

      // Calculate total quantity sold
      const totalQuantitySold = productsArray.reduce(
        (sum, product) => sum + product.totalQuantity,
        0,
      );

      return {
        data: {
          summary: {
            period: {
              from: effectiveDateFrom,
              to: effectiveDateTo,
            },
            totalRevenue,
            totalQuantitySold,
            totalProductsSold: productsArray.length,
          },
          topProductsByQuantity,
          topProductsByRevenue,
        },
        message: 'Sales performance report generated successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Error generating sales performance report: ' + error.message,
      );
    }
  }

  /**
   * Generate a report of price changes across products
   * Useful for tracking price trends and monitoring inflation
   */
  async generatePriceChangesReport(dateFrom?: Date, dateTo?: Date) {
    try {
      // Set default date range if not provided (last 90 days)
      const now = new Date();
      const defaultDateFrom = new Date();
      defaultDateFrom.setDate(now.getDate() - 90);

      const effectiveDateFrom = dateFrom || defaultDateFrom;
      const effectiveDateTo = dateTo || now;

      if (effectiveDateFrom > effectiveDateTo) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Get all price changes within the date range
      const priceChanges = await this.prisma.price.findMany({
        where: {
          createdAt: {
            gte: effectiveDateFrom,
            lte: effectiveDateTo,
          },
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Group price changes by product
      const productPriceChanges: Record<
        number,
        {
          productId: number;
          name: string;
          priceChanges: {
            id: number;
            date: Date;
            purchasePrice: number;
            sellingPrice: number;
            purchasePriceChange?: number;
            sellingPriceChange?: number;
            purchasePriceChangePercent?: number;
            sellingPriceChangePercent?: number;
          }[];
          initialPurchasePrice: number;
          latestPurchasePrice: number;
          initialSellingPrice: number;
          latestSellingPrice: number;
          purchasePriceChangePercent: number;
          sellingPriceChangePercent: number;
        }
      > = {};

      // First pass to collect all price changes by product
      priceChanges.forEach((price) => {
        const productId = price.productId;
        if (!productPriceChanges[productId]) {
          productPriceChanges[productId] = {
            productId,
            name: price.product.name,
            priceChanges: [],
            initialPurchasePrice: 0,
            latestPurchasePrice: 0,
            initialSellingPrice: 0,
            latestSellingPrice: 0,
            purchasePriceChangePercent: 0,
            sellingPriceChangePercent: 0,
          };
        }

        productPriceChanges[productId].priceChanges.push({
          id: price.id,
          date: price.createdAt,
          purchasePrice: Number(price.purchasePrice),
          sellingPrice: Number(price.sellingPrice),
        });
      });

      // Second pass to calculate price changes and percentages
      Object.values(productPriceChanges).forEach((product) => {
        // Sort price changes by date (oldest first)
        product.priceChanges.sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        );

        // Set initial and latest prices
        if (product.priceChanges.length > 0) {
          product.initialPurchasePrice = product.priceChanges[0].purchasePrice;
          product.initialSellingPrice = product.priceChanges[0].sellingPrice;

          product.latestPurchasePrice =
            product.priceChanges[product.priceChanges.length - 1].purchasePrice;
          product.latestSellingPrice =
            product.priceChanges[product.priceChanges.length - 1].sellingPrice;

          // Calculate overall percentage changes
          product.purchasePriceChangePercent =
            product.initialPurchasePrice > 0
              ? ((product.latestPurchasePrice - product.initialPurchasePrice) /
                  product.initialPurchasePrice) *
                100
              : 0;

          product.sellingPriceChangePercent =
            product.initialSellingPrice > 0
              ? ((product.latestSellingPrice - product.initialSellingPrice) /
                  product.initialSellingPrice) *
                100
              : 0;
        }

        // Calculate changes between consecutive prices
        for (let i = 1; i < product.priceChanges.length; i++) {
          const current = product.priceChanges[i];
          const previous = product.priceChanges[i - 1];

          current.purchasePriceChange =
            current.purchasePrice - previous.purchasePrice;
          current.sellingPriceChange =
            current.sellingPrice - previous.sellingPrice;

          current.purchasePriceChangePercent =
            previous.purchasePrice > 0
              ? (current.purchasePriceChange / previous.purchasePrice) * 100
              : 0;

          current.sellingPriceChangePercent =
            previous.sellingPrice > 0
              ? (current.sellingPriceChange / previous.sellingPrice) * 100
              : 0;
        }
      });

      // Convert to array and sort by highest price increase percentage
      const productsWithPriceChanges = Object.values(productPriceChanges).sort(
        (a, b) => b.sellingPriceChangePercent - a.sellingPriceChangePercent,
      );

      // Calculate average price changes across all products
      let totalPurchasePriceChangePercent = 0;
      let totalSellingPriceChangePercent = 0;
      const productCount = productsWithPriceChanges.length;

      productsWithPriceChanges.forEach((product) => {
        totalPurchasePriceChangePercent += product.purchasePriceChangePercent;
        totalSellingPriceChangePercent += product.sellingPriceChangePercent;
      });

      const avgPurchasePriceChangePercent =
        productCount > 0 ? totalPurchasePriceChangePercent / productCount : 0;

      const avgSellingPriceChangePercent =
        productCount > 0 ? totalSellingPriceChangePercent / productCount : 0;

      return {
        data: {
          summary: {
            period: {
              from: effectiveDateFrom,
              to: effectiveDateTo,
            },
            totalPriceChanges: priceChanges.length,
            productsWithPriceChanges: productCount,
            avgPurchasePriceChangePercent,
            avgSellingPriceChangePercent,
          },
          productsWithPriceChanges,
        },
        message: 'Price changes report generated successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Error generating price changes report: ' + error.message,
      );
    }
  }
}
