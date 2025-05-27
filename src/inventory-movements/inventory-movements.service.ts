import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  CreateInventoryMovementDto,
  FilterInventoryMovementDto,
  MovementType,
  UpdateInventoryMovementDto,
} from './dto';

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createInventoryMovementDto: CreateInventoryMovementDto,
    userId: string,
  ) {
    const { type, productId, supplierId, saleId, quantity } =
      createInventoryMovementDto;

    // Validate input based on movement type
    if (type === MovementType.ENTRY && !supplierId) {
      throw new BadRequestException(
        'Supplier ID is required for inventory entries',
      );
    }

    // Check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // If supplier is provided, check if it exists
    if (supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${supplierId} not found`);
      }
    }

    // If sale is provided, check if it exists
    if (saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
      });
      if (!sale) {
        throw new NotFoundException(`Sale with ID ${saleId} not found`);
      }
    }

    // Calculate stock quantity adjustment based on movement type
    const stockAdjustment = type === MovementType.ENTRY ? quantity : -quantity;

    // Use a transaction to ensure both the movement and stock update succeed or fail together
    const inventoryMovement = await this.prisma.$transaction(async (tx) => {
      // Create the inventory movement
      const movement = await tx.inventoryMovement.create({
        data: {
          ...createInventoryMovementDto,
          userId,
        },
        include: {
          product: true,
          supplier: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sale: true,
        },
      });

      // Update the product stock
      await this.productsService.updateStock(productId, stockAdjustment);

      return movement;
    });

    return {
      data: inventoryMovement,
      message: 'Inventory movement created successfully',
    };
  }

  async findAll(filters: FilterInventoryMovementDto = {}) {
    const {
      type,
      productId,
      supplierId,
      saleId,
      dateFrom,
      dateTo,
      reason,
      page = 1,
      limit = 10,
    } = filters;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (productId) {
      where.productId = productId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (saleId) {
      where.saleId = saleId;
    }

    if (reason) {
      where.reason = {
        contains: reason,
        mode: 'insensitive',
      };
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      where.movementDate = {};

      if (dateFrom) {
        where.movementDate.gte = dateFrom;
      }

      if (dateTo) {
        where.movementDate.lte = dateTo;
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for these filters
    const total = await this.prisma.inventoryMovement.count({ where });

    // Get paginated inventory movements
    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        movementDate: 'desc',
      },
      include: {
        product: true,
        supplier: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sale: true,
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      message: 'Inventory movements retrieved successfully',
    };
  }

  async findOne(id: number) {
    const movement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sale: true,
      },
    });

    if (!movement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

    return {
      data: movement,
      message: 'Inventory movement found successfully',
    };
  }

  async update(
    id: number,
    updateInventoryMovementDto: UpdateInventoryMovementDto,
  ) {
    // Check if the movement exists
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
    });

    if (!existingMovement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

    // Note: We'll only allow updating notes and reason, not quantities or types
    // as this would require complex stock adjustments

    if (
      updateInventoryMovementDto.type !== undefined ||
      updateInventoryMovementDto.quantity !== undefined ||
      updateInventoryMovementDto.productId !== undefined ||
      updateInventoryMovementDto.supplierId !== undefined ||
      updateInventoryMovementDto.saleId !== undefined
    ) {
      throw new BadRequestException(
        'Cannot update movement type, quantity, product, supplier, or sale. Create a new movement instead.',
      );
    }

    const updatedMovement = await this.prisma.inventoryMovement.update({
      where: { id },
      data: {
        reason: updateInventoryMovementDto.reason,
        notes: updateInventoryMovementDto.notes,
      },
      include: {
        product: true,
        supplier: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sale: true,
      },
    });

    return {
      data: updatedMovement,
      message: 'Inventory movement updated successfully',
    };
  }

  async remove(id: number) {
    // Check if the movement exists
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
    });

    if (!existingMovement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

    // For inventory movements, we don't allow deletion as it would affect stock history
    throw new BadRequestException(
      'Inventory movements cannot be deleted to maintain accurate stock history.',
    );
  }

  async getProductMovementsHistory(
    productId: number,
    filters: FilterInventoryMovementDto = {},
  ) {
    // Check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Override the productId in filters
    filters.productId = productId;

    // Use the findAll method to get paginated results
    return this.findAll(filters);
  }

  /**
   * Returns a list of products that are below their minimum stock level or above their maximum stock level
   * This helps inventory managers to quickly identify products that need to be restocked or that have excess inventory
   */
  async getStockAlerts() {
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
        // First sort by how critical the shortage is
        currentStock: 'asc',
      },
    });

    const productsWithHighStock = await this.prisma.product.findMany({
      where: {
        isActive: true,
        // Only include products with defined maxQuantity
        maxQuantity: { not: null },
        // Check if currentStock > maxQuantity
        currentStock: {
          gt: this.prisma.product.fields.maxQuantity,
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
        // Sort by excess amount (highest excess first)
        currentStock: 'desc',
      },
    });

    return {
      data: {
        lowStock: productsWithLowStock,
        highStock: productsWithHighStock,
      },
      message: 'Stock alerts retrieved successfully',
    };
  }

  /**
   * Generates a report of stock transactions within a specific date range
   * Useful for inventory auditing and analysis
   */
  async generateStockTransactionsReport(dateFrom: Date, dateTo: Date) {
    if (dateFrom > dateTo) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Get all movements within the date range
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        movementDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        product: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        sale: {
          select: {
            id: true,
            saleDate: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        movementDate: 'asc',
      },
    });

    // Calculate summary statistics
    const summary = {
      totalMovements: movements.length,
      entriesCount: movements.filter((m) => m.type === 'ENTRY').length,
      exitsCount: movements.filter((m) => m.type === 'EXIT').length,
      totalItemsReceived: movements
        .filter((m) => m.type === 'ENTRY')
        .reduce((sum, movement) => sum + movement.quantity, 0),
      totalItemsRemoved: movements
        .filter((m) => m.type === 'EXIT')
        .reduce((sum, movement) => sum + movement.quantity, 0),
      periodStart: dateFrom,
      periodEnd: dateTo,
    };

    // Get products with most movements
    const productMovements = {};
    movements.forEach((movement) => {
      const productId = movement.productId;
      if (!productMovements[productId]) {
        productMovements[productId] = {
          productId,
          productName: movement.product.name,
          entriesCount: 0,
          exitsCount: 0,
          totalEntryQuantity: 0,
          totalExitQuantity: 0,
        };
      }

      if (movement.type === 'ENTRY') {
        productMovements[productId].entriesCount++;
        productMovements[productId].totalEntryQuantity += movement.quantity;
      } else {
        productMovements[productId].exitsCount++;
        productMovements[productId].totalExitQuantity += movement.quantity;
      }
    });

    const productsWithMostMovement = Object.values(productMovements)
      .sort(
        (a: any, b: any) =>
          b.entriesCount + b.exitsCount - (a.entriesCount + a.exitsCount),
      )
      .slice(0, 10);

    return {
      data: {
        summary,
        topProducts: productsWithMostMovement,
        movements,
      },
      message: 'Stock transactions report generated successfully',
    };
  }
}
