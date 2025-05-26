import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  CreateInventoryMovementDto,
  FilterInventoryMovementDto,
  UpdateInventoryMovementDto,
} from './dto';
import { MovementType } from './dto/inventory-movement.types';

/**
 * Service responsible for managing inventory movements
 * Handles creation, retrieval, and management of stock movements including entries and exits
 * Provides functionality for stock tracking, alerts, and reporting
 */
@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Creates a new inventory movement and updates product stock accordingly
   * @param createInventoryMovementDto - Data for creating the movement
   * @param userId - ID of the user creating the movement
   * @returns Created movement with related entities
   * @throws BadRequestException when supplier ID is missing for entries
   * @throws NotFoundException when product, supplier, or sale is not found
   */
  async create(
    createInventoryMovementDto: CreateInventoryMovementDto,
    userId: string,
  ) {
    const { type, productId, supplierId, saleId, quantity } =
      createInventoryMovementDto;

    if (type === MovementType.ENTRY && !supplierId) {
      throw new BadRequestException(
        'Supplier ID is required for inventory entries',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${supplierId} not found`);
      }
    }

    if (saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
      });
      if (!sale) {
        throw new NotFoundException(`Sale with ID ${saleId} not found`);
      }
    }

    const stockAdjustment = type === MovementType.ENTRY ? quantity : -quantity;

    const inventoryMovement = await this.prisma.$transaction(async (tx) => {
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

      await this.productsService.updateStock(productId, stockAdjustment);

      return movement;
    });

    return {
      data: inventoryMovement,
      message: 'Inventory movement created successfully',
    };
  }

  /**
   * Retrieves all inventory movements with filtering and pagination
   * @param filters - Optional filters for type, product, supplier, sale, date range, and reason
   * @returns Paginated list of inventory movements with related entities
   */
  async findAll(
    filters: FilterInventoryMovementDto = {},
  ): Promise<PaginatedResponse<any>> {
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

    if (dateFrom || dateTo) {
      where.movementDate = {};

      if (dateFrom) {
        where.movementDate.gte = dateFrom;
      }

      if (dateTo) {
        where.movementDate.lte = dateTo;
      }
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
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
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return this.paginationService.createPaginationObject(
      movements,
      total,
      page,
      limit,
      'Inventory movements retrieved successfully',
    );
  }

  /**
   * Retrieves a specific inventory movement by ID
   * @param id - Movement's unique identifier
   * @returns Movement with related entities
   * @throws NotFoundException when movement is not found
   */
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

  /**
   * Updates an inventory movement's non-critical information
   * @param id - Movement's unique identifier
   * @param updateInventoryMovementDto - Data to update (only reason and notes)
   * @returns Updated movement with related entities
   * @throws NotFoundException when movement is not found
   * @throws BadRequestException when attempting to update critical fields
   */
  async update(
    id: number,
    updateInventoryMovementDto: UpdateInventoryMovementDto,
  ) {
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
    });

    if (!existingMovement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

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

  /**
   * Attempts to remove an inventory movement (operation not allowed)
   * @param id - Movement's unique identifier
   * @throws BadRequestException as movements cannot be deleted
   * @throws NotFoundException when movement is not found
   */
  async remove(id: number) {
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
    });

    if (!existingMovement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

    throw new BadRequestException(
      'Inventory movements cannot be deleted to maintain accurate stock history.',
    );
  }

  /**
   * Retrieves movement history for a specific product
   * @param productId - Product's unique identifier
   * @param filters - Optional filters for pagination and date range
   * @returns Paginated list of movements for the specified product
   * @throws NotFoundException when product is not found
   */
  async getProductMovementsHistory(
    productId: number,
    filters: FilterInventoryMovementDto = {},
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, dateFrom, dateTo } = filters;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const where: any = {
      productId,
    };

    if (dateFrom || dateTo) {
      where.movementDate = {};

      if (dateFrom) {
        where.movementDate.gte = dateFrom;
      }

      if (dateTo) {
        where.movementDate.lte = dateTo;
      }
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
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
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return this.paginationService.createPaginationObject(
      movements,
      total,
      page,
      limit,
      `Inventory movements for product ${product.name} retrieved successfully`,
    );
  }

  /**
   * Retrieves products with stock levels outside their defined thresholds
   * @returns Object containing lists of products with low and high stock levels
   * Helps inventory managers identify products that need attention
   */
  async getStockAlerts() {
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

    const productsWithHighStock = await this.prisma.product.findMany({
      where: {
        isActive: true,
        maxQuantity: { not: null },
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
   * Generates a comprehensive report of stock transactions for a specified period
   * @param dateFrom - Start date for the report period
   * @param dateTo - End date for the report period
   * @returns Detailed report including summary statistics and movement details
   * @throws BadRequestException when date range is invalid
   */
  async generateStockTransactionsReport(dateFrom: Date, dateTo: Date) {
    if (dateFrom > dateTo) {
      throw new BadRequestException('Start date must be before end date');
    }

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
