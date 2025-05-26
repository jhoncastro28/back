import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustStockDto,
  CreateProductDto,
  CreateProductWithPriceDto,
  FilterProductDto,
  PaginatedProductResponse,
  ProductResponse,
  StockAdjustmentType,
  UpdateProductDto,
} from './dto';

/**
 * Interface representing a product with its related entities
 * Used for internal service operations and mapping
 */
interface ProductWithRelations {
  id: number;
  name: string;
  description?: string;
  minQuantity: number;
  maxQuantity: number;
  currentStock: number;
  isActive: boolean;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
  supplier?: {
    id: number;
    name: string;
    email: string;
  };
  prices?: Array<{
    id: number;
    purchasePrice: any;
    sellingPrice: any;
    isCurrentPrice: boolean;
  }>;
}

/**
 * Service responsible for managing products in the inventory system
 * Handles product creation, updates, stock management, and reporting
 */
@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Maps a product entity with relations to a standardized response format
   * Handles price conversion and optional supplier information
   * @param product - Product entity with optional relations
   * @returns Formatted product response
   * @private
   */
  private mapProductToResponse(product: ProductWithRelations): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity,
      currentStock: product.currentStock,
      isActive: product.isActive,
      supplierId: product.supplierId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      supplier: product.supplier
        ? {
            id: product.supplier.id,
            name: product.supplier.name,
            email: product.supplier.email,
          }
        : undefined,
      prices: product.prices?.map((price) => ({
        id: price.id,
        purchasePrice: Number(price.purchasePrice),
        sellingPrice: Number(price.sellingPrice),
        isCurrentPrice: price.isCurrentPrice,
      })),
    };
  }

  /**
   * Creates a new product with initial price information
   * @param createProductDto - Data for creating the product and its initial price
   * @returns Newly created product with price information
   * @throws NotFoundException if supplier does not exist
   */
  async create(createProductDto: CreateProductDto): Promise<ProductResponse> {
    const { purchasePrice, sellingPrice, ...productData } = createProductDto;

    const supplierExists = await this.prisma.supplier.findUnique({
      where: { id: createProductDto.supplierId },
    });

    if (!supplierExists) {
      throw new NotFoundException(
        `Supplier with ID ${createProductDto.supplierId} not found`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          currentStock: 0,
        },
        include: {
          supplier: true,
          prices: true,
        },
      });

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

    return this.mapProductToResponse(result);
  }

  /**
   * Retrieves all products with optional filtering and pagination
   * @param filters - Optional filters for name, active status, supplier, and pagination
   * @returns Paginated list of products with their current prices
   */
  async findAll(
    filters: FilterProductDto = {},
  ): Promise<PaginatedProductResponse> {
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
      where.supplierId = supplierId;
    }

    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      skip: this.paginationService.getPaginationSkip(page, limit),
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

    const mappedProducts = products.map((product) =>
      this.mapProductToResponse(product),
    );

    const paginatedResponse = this.paginationService.createPaginationObject(
      mappedProducts,
      total,
      page,
      limit,
      'Products retrieved successfully',
    );

    return {
      ...paginatedResponse,
      message: paginatedResponse.message || 'Products retrieved successfully',
      success: true,
    };
  }

  /**
   * Retrieves a specific product by ID with its complete price history
   * @param id - ID of the product to retrieve
   * @returns Product with supplier and price history
   * @throws NotFoundException if product does not exist
   */
  async findOne(id: number): Promise<ProductResponse> {
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

    return this.mapProductToResponse(product);
  }

  /**
   * Updates a product and optionally its current price
   * @param id - ID of the product to update
   * @param updateProductDto - Data for updating the product and optionally its price
   * @returns Updated product with latest information
   * @throws NotFoundException if product or supplier does not exist
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponse> {
    const { purchasePrice, sellingPrice, ...productData } = updateProductDto;

    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

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

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
        include: {
          supplier: true,
          prices: true,
        },
      });

      if (purchasePrice !== undefined || sellingPrice !== undefined) {
        const currentPrice = await tx.price.findFirst({
          where: {
            productId: id,
            isCurrentPrice: true,
          },
        });

        if (currentPrice) {
          await tx.price.update({
            where: { id: currentPrice.id },
            data: {
              isCurrentPrice: false,
              validTo: new Date(),
            },
          });
        }

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

    return this.mapProductToResponse(result);
  }

  /**
   * Deactivates a product (logical deletion)
   * Preserves historical data while preventing the product from being displayed in active listings
   * @param id - ID of the product to deactivate
   * @throws NotFoundException if product does not exist
   */
  async deactivate(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activates a previously deactivated product
   * Makes the product available again in active listings
   * @param id - ID of the product to activate
   * @throws NotFoundException if product does not exist
   */
  async activate(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Retrieves products with stock levels below their minimum quantity
   * @returns List of products with low stock and their supplier information
   */
  async getLowStockProducts() {
    const productsWithLowStock = await this.prisma.product.findMany({
      where: {
        isActive: true,
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
        currentStock: 'asc',
      },
    });

    return {
      data: productsWithLowStock,
      message: 'Low stock products retrieved successfully',
    };
  }

  /**
   * Retrieves price history for a specific product
   * @param id - ID of the product
   * @returns Complete price history ordered by date
   * @throws NotFoundException if product does not exist
   */
  async getPriceHistory(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

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
   * Manually adjusts the stock level of a product
   * @param id - ID of the product
   * @param adjustStockDto - Data for the stock adjustment
   * @returns Updated product information
   * @throws NotFoundException if product does not exist
   * @throws BadRequestException if adjustment would result in negative stock
   */
  async adjustStock(id: number, adjustStockDto: AdjustStockDto) {
    const { type, quantity, reason, notes } = adjustStockDto;

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const stockChange =
      type === StockAdjustmentType.INCREASE ? quantity : -quantity;

    if (product.currentStock + stockChange < 0) {
      throw new BadRequestException(
        `Cannot decrease stock below zero. Current stock: ${product.currentStock}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          currentStock: {
            increment: stockChange,
          },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          type: type === StockAdjustmentType.INCREASE ? 'ENTRY' : 'EXIT',
          quantity,
          reason: reason || 'Manual stock adjustment',
          notes,
          productId: id,
          userId: '1',
          movementDate: new Date(),
        },
      });

      return {
        data: updatedProduct,
        message: `Stock successfully ${type.toLowerCase()}d by ${quantity} units`,
      };
    });
  }

  /**
   * Updates the stock quantity of a product
   * @param id - ID of the product
   * @param quantity - Quantity to add or subtract from current stock
   * @returns Updated product information
   * @throws NotFoundException if product does not exist
   * @throws Error if adjustment would result in negative stock
   */
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
   * Generates a comprehensive stock status report
   * Includes categorization of products by stock level and value calculations
   * @returns Detailed report of stock status across all products
   * @throws BadRequestException if report generation fails
   */
  async generateStockStatusReport() {
    try {
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

      const totalProducts = products.length;
      const totalStock = products.reduce(
        (sum, product) => sum + product.currentStock,
        0,
      );
      const averageStock = totalProducts > 0 ? totalStock / totalProducts : 0;

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
   * Generates a sales performance report for products
   * @param dateFrom - Start date for the report period
   * @param dateTo - End date for the report period
   * @returns Detailed sales analysis including top products and revenue metrics
   * @throws BadRequestException if report generation fails or dates are invalid
   */
  async generateSalesPerformanceReport(dateFrom?: Date, dateTo?: Date) {
    try {
      const now = new Date();
      const defaultDateFrom = new Date();
      defaultDateFrom.setDate(now.getDate() - 30);

      const effectiveDateFrom = dateFrom || defaultDateFrom;
      const effectiveDateTo = dateTo || now;

      if (effectiveDateFrom > effectiveDateTo) {
        throw new BadRequestException('Start date must be before end date');
      }

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

      Object.values(productSales).forEach((product) => {
        product.averagePrice =
          product.totalQuantity > 0
            ? product.totalRevenue / product.totalQuantity
            : 0;
      });

      const productsArray = Object.values(productSales);

      const topProductsByQuantity = [...productsArray]
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      const topProductsByRevenue = [...productsArray]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      const totalRevenue = productsArray.reduce(
        (sum, product) => sum + product.totalRevenue,
        0,
      );

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
   * Generates a report of price changes across products
   * @param dateFrom - Start date for the report period
   * @param dateTo - End date for the report period
   * @returns Analysis of price trends and changes
   * @throws BadRequestException if report generation fails or dates are invalid
   */
  async generatePriceChangesReport(dateFrom?: Date, dateTo?: Date) {
    try {
      const now = new Date();
      const defaultDateFrom = new Date();
      defaultDateFrom.setDate(now.getDate() - 90);

      const effectiveDateFrom = dateFrom || defaultDateFrom;
      const effectiveDateTo = dateTo || now;

      if (effectiveDateFrom > effectiveDateTo) {
        throw new BadRequestException('Start date must be before end date');
      }

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

      Object.values(productPriceChanges).forEach((product) => {
        product.priceChanges.sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        );

        if (product.priceChanges.length > 0) {
          product.initialPurchasePrice = product.priceChanges[0].purchasePrice;
          product.initialSellingPrice = product.priceChanges[0].sellingPrice;

          product.latestPurchasePrice =
            product.priceChanges[product.priceChanges.length - 1].purchasePrice;
          product.latestSellingPrice =
            product.priceChanges[product.priceChanges.length - 1].sellingPrice;

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

      const productsWithPriceChanges = Object.values(productPriceChanges).sort(
        (a, b) => b.sellingPriceChangePercent - a.sellingPriceChangePercent,
      );

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

  /**
   * Creates a new product with optional price and discount information
   * @param createProductDto - Data for creating the product with optional price and discount
   * @returns Newly created product with price and discount information
   */
  async createWithPrice(
    createProductDto: CreateProductWithPriceDto,
  ): Promise<ProductResponse> {
    const { price, discount, ...productData } = createProductDto;

    const supplierExists = await this.prisma.supplier.findUnique({
      where: { id: createProductDto.supplierId },
    });

    if (!supplierExists) {
      throw new NotFoundException(
        `Supplier with ID ${createProductDto.supplierId} not found`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          ...productData,
          currentStock: 0,
        },
        include: {
          supplier: true,
          prices: true,
        },
      });

      // If price information is provided, create the price
      if (price) {
        const newPrice = await tx.price.create({
          data: {
            purchasePrice: price.purchasePrice,
            sellingPrice: price.sellingPrice,
            isCurrentPrice: price.isCurrentPrice ?? true,
            productId: product.id,
          },
        });

        // If discount information is provided, create the discount
        if (discount) {
          await tx.discount.create({
            data: {
              ...discount,
              priceId: newPrice.id,
            },
          });
        }
      }

      return product;
    });

    return this.mapProductToResponse(result);
  }

  /**
   * Retrieves a product with its current price and active discounts
   * @param id - Product ID
   * @returns Product with price and discount information
   */
  async findOneWithPriceAndDiscount(id: number): Promise<
    ProductResponse & {
      currentPrice?: {
        id: number;
        purchasePrice: number;
        sellingPrice: number;
        discounts: Array<{
          id: number;
          name: string;
          type: string;
          value: number;
          startDate: Date;
          endDate?: Date;
        }>;
      };
    }
  > {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        prices: {
          where: {
            isCurrentPrice: true,
          },
          include: {
            discounts: {
              where: {
                isActive: true,
                startDate: {
                  lte: new Date(),
                },
                OR: [
                  {
                    endDate: null,
                  },
                  {
                    endDate: {
                      gte: new Date(),
                    },
                  },
                ],
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const baseResponse = this.mapProductToResponse(product);
    const currentPrice = product.prices[0];

    return {
      ...baseResponse,
      currentPrice: currentPrice
        ? {
            id: currentPrice.id,
            purchasePrice: Number(currentPrice.purchasePrice),
            sellingPrice: Number(currentPrice.sellingPrice),
            discounts: currentPrice.discounts.map((discount) => ({
              id: discount.id,
              name: discount.name,
              type: discount.type,
              value: Number(discount.value),
              startDate: discount.startDate,
              endDate: discount.endDate,
            })),
          }
        : undefined,
    };
  }
}
