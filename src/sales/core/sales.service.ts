import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto, SaleFilterDto, UpdateSaleDto } from './dto';
import { PaginatedSaleResponse, SaleResponse } from './dto/sale-response.dto';

/**
 * Service responsible for managing sales operations
 * Handles sale creation, updates, and related inventory movements
 */
@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Maps a sale entity to a standardized response format
   * @param sale - Sale entity with relations
   * @returns Formatted sale response with client and user details
   * @private
   */
  private mapSaleToResponse(sale: any): SaleResponse {
    return {
      id: sale.id,
      saleDate: sale.saleDate,
      clientId: sale.clientId,
      client: {
        id: sale.client.id,
        name: sale.client.name,
        email: sale.client.email,
      },
      userId: sale.userId,
      user: {
        id: sale.user.id,
        name: `${sale.user.firstName} ${sale.user.lastName}`,
        email: sale.user.email,
      },
      totalAmount: Number(sale.totalAmount),
      details:
        sale.saleDetails?.map((detail) => ({
          id: detail.id,
          productId: detail.productId,
          productName: detail.product.name,
          quantity: detail.quantity,
          unitPrice: Number(detail.unitPrice),
          subtotal: Number(detail.unitPrice) * detail.quantity,
        })) || [],
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }

  /**
   * Creates a new sale with its details and updates inventory accordingly
   * @param createSaleDto - Data for creating the sale and its details
   * @param userId - ID of the user creating the sale
   * @returns Created sale with all relations
   * @throws NotFoundException if client or products don't exist
   * @throws BadRequestException if there's insufficient stock
   */
  async create(createSaleDto: CreateSaleDto, userId: string) {
    const { details, ...saleData } = createSaleDto;

    const clientExists = await this.prisma.client.findUnique({
      where: { id: saleData.clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(
        `Client with id ${saleData.clientId} not found`,
      );
    }

    let totalAmount = 0;

    for (const detail of details) {
      const product = await this.prisma.product.findUnique({
        where: { id: detail.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${detail.productId} not found`,
        );
      }

      if (product.currentStock < detail.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}. Available: ${product.currentStock}`,
        );
      }

      const subtotal =
        detail.unitPrice * detail.quantity - (detail.discountAmount || 0);
      totalAmount += subtotal;
    }

    return this.prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.create({
        data: {
          ...saleData,
          userId,
          totalAmount,
          saleDetails: {
            create: details.map((detail) => ({
              quantity: detail.quantity,
              unitPrice: detail.unitPrice,
              discountAmount: detail.discountAmount,
              subtotal:
                detail.unitPrice * detail.quantity -
                (detail.discountAmount || 0),
              productId: detail.productId,
            })),
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          saleDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      for (const detail of details) {
        await prisma.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              decrement: detail.quantity,
            },
          },
        });

        await prisma.inventoryMovement.create({
          data: {
            type: 'EXIT',
            quantity: detail.quantity,
            reason: 'SALE',
            productId: detail.productId,
            userId,
            saleId: sale.id,
          },
        });
      }

      return sale;
    });
  }

  /**
   * Retrieves all sales with optional filtering and pagination
   * @param filters - Optional filters for date range, client, and pagination
   * @returns Paginated list of sales with their details
   */
  async findAll(filters: SaleFilterDto): Promise<PaginatedSaleResponse> {
    const { page = 1, limit = 10, startDate, endDate, clientId } = filters;
    const skip = this.paginationService.getPaginationSkip(page, limit);

    const where: any = {};

    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.saleDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.saleDate = {
        lte: new Date(endDate),
      };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const total = await this.prisma.sale.count({ where });

    const sales = await this.prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        saleDate: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const mappedSales = sales.map((sale) => this.mapSaleToResponse(sale));

    const paginatedResponse = this.paginationService.createPaginationObject(
      mappedSales,
      total,
      page,
      limit,
      'Sales retrieved successfully',
    );

    return {
      ...paginatedResponse,
      message: paginatedResponse.message || 'Sales retrieved successfully',
      success: true,
    };
  }

  /**
   * Retrieves a specific sale by ID with all its details
   * @param id - ID of the sale to retrieve
   * @returns Sale with client, user, and detail information
   * @throws NotFoundException if sale doesn't exist
   */
  async findOne(id: number): Promise<SaleResponse> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    return this.mapSaleToResponse(sale);
  }

  /**
   * Updates a sale's information
   * @param id - ID of the sale to update
   * @param updateSaleDto - Data for updating the sale
   * @returns Updated sale with all relations
   * @throws NotFoundException if sale or client doesn't exist
   */
  async update(
    id: number,
    updateSaleDto: UpdateSaleDto,
  ): Promise<SaleResponse> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    if (updateSaleDto.clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: updateSaleDto.clientId },
      });

      if (!clientExists) {
        throw new NotFoundException(
          `Client with id ${updateSaleDto.clientId} not found`,
        );
      }
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: updateSaleDto,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
    });

    return this.mapSaleToResponse(updatedSale);
  }

  /**
   * Removes a sale and restores product stock
   * @param id - ID of the sale to remove
   * @throws NotFoundException if sale doesn't exist
   */
  async remove(id: number): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        saleDetails: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      for (const detail of sale.saleDetails) {
        await prisma.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              increment: detail.quantity,
            },
          },
        });

        await prisma.inventoryMovement.create({
          data: {
            type: 'ENTRY',
            quantity: detail.quantity,
            reason: 'SALE_CANCELLATION',
            productId: detail.productId,
            userId: sale.userId,
            saleId: sale.id,
          },
        });
      }

      await prisma.sale.delete({
        where: { id },
      });
    });
  }
}
