import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDetailDto, UpdateSaleDetailDto } from './dto';
import { FilterSaleDetailDto } from './dto/filter-sale-detail.dto';
import {
  PaginatedSaleDetailResponse,
  SaleDetailResponse,
} from './dto/sale-detail-response.dto';

/**
 * Service responsible for managing sale details operations
 * Handles creation, modification and deletion of individual sale items
 */
@Injectable()
export class SaleDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Maps a sale detail entity to a standardized response format
   * @param detail - Sale detail entity with relations
   * @returns Formatted sale detail response
   * @private
   */
  private mapSaleDetailToResponse(detail: any): SaleDetailResponse {
    return {
      id: detail.id,
      saleId: detail.saleId,
      productId: detail.productId,
      productName: detail.product.name,
      quantity: detail.quantity,
      unitPrice: Number(detail.unitPrice),
      subtotal: Number(detail.unitPrice) * detail.quantity,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
    };
  }

  /**
   * Creates a new sale detail and updates related inventory
   * @param createSaleDetailDto - Data for creating the sale detail
   * @returns Created sale detail with product information
   * @throws NotFoundException if sale or product doesn't exist
   * @throws Error if product has insufficient stock or no price defined
   */
  async create(
    createSaleDetailDto: CreateSaleDetailDto,
  ): Promise<SaleDetailResponse> {
    const { saleId, productId, quantity } = createSaleDetailDto;

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          where: { isCurrentPrice: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.currentStock < quantity) {
      throw new Error(
        `Insufficient stock for product ${product.name}. Available: ${product.currentStock}`,
      );
    }

    const currentPrice = product.prices[0];
    if (!currentPrice) {
      throw new Error(`No price defined for product ${product.name}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const detail = await tx.saleDetail.create({
        data: {
          sale: {
            connect: { id: saleId },
          },
          product: {
            connect: { id: productId },
          },
          quantity,
          unitPrice: currentPrice.sellingPrice,
          subtotal: new Decimal(Number(currentPrice.sellingPrice) * quantity),
        },
        include: {
          product: true,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            decrement: quantity,
          },
        },
      });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          totalAmount: {
            increment: Number(currentPrice.sellingPrice) * quantity,
          },
        },
      });

      return detail;
    });

    return this.mapSaleDetailToResponse(result);
  }

  /**
   * Retrieves all sale details with optional filtering and pagination
   * @param filters - Optional filters for sale ID, product ID, and pagination
   * @returns Paginated list of sale details
   */
  async findAll(
    filters: FilterSaleDetailDto,
  ): Promise<PaginatedSaleDetailResponse> {
    const { saleId, productId, page = 1, limit = 10 } = filters;

    const where: any = {
      ...(saleId && { saleId }),
      ...(productId && { productId }),
    };

    const total = await this.prisma.saleDetail.count({ where });

    const details = await this.prisma.saleDetail.findMany({
      where,
      skip: this.paginationService.getPaginationSkip(page, limit),
      take: limit,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedDetails = details.map((detail) =>
      this.mapSaleDetailToResponse(detail),
    );

    const paginatedResponse = this.paginationService.createPaginationObject(
      mappedDetails,
      total,
      page,
      limit,
      'Sale details retrieved successfully',
    );

    return {
      ...paginatedResponse,
      message:
        paginatedResponse.message || 'Sale details retrieved successfully',
      success: true,
    };
  }

  /**
   * Retrieves a specific sale detail by ID
   * @param id - ID of the sale detail to retrieve
   * @returns Sale detail with product information
   * @throws NotFoundException if sale detail doesn't exist
   */
  async findOne(id: number): Promise<SaleDetailResponse> {
    const detail = await this.prisma.saleDetail.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(`Sale detail with ID ${id} not found`);
    }

    return this.mapSaleDetailToResponse(detail);
  }

  /**
   * Updates a sale detail and adjusts inventory accordingly
   * @param id - ID of the sale detail to update
   * @param updateSaleDetailDto - Data for updating the sale detail
   * @returns Updated sale detail with product information
   * @throws NotFoundException if sale detail doesn't exist
   * @throws Error if there's insufficient stock for quantity increase
   */
  async update(
    id: number,
    updateSaleDetailDto: UpdateSaleDetailDto,
  ): Promise<SaleDetailResponse> {
    const { quantity } = updateSaleDetailDto;

    const existingDetail = await this.prisma.saleDetail.findUnique({
      where: { id },
      include: {
        product: true,
        sale: true,
      },
    });

    if (!existingDetail) {
      throw new NotFoundException(`Sale detail with ID ${id} not found`);
    }

    if (quantity !== undefined && quantity !== existingDetail.quantity) {
      const quantityDiff = quantity - existingDetail.quantity;

      if (quantityDiff > 0) {
        if (existingDetail.product.currentStock < quantityDiff) {
          throw new Error(
            `Insufficient stock for product ${existingDetail.product.name}. Available: ${existingDetail.product.currentStock}`,
          );
        }
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedDetail = await tx.saleDetail.update({
          where: { id },
          data: { quantity },
          include: {
            product: true,
          },
        });

        await tx.product.update({
          where: { id: existingDetail.productId },
          data: {
            currentStock: {
              decrement: quantityDiff,
            },
          },
        });

        await tx.sale.update({
          where: { id: existingDetail.saleId },
          data: {
            totalAmount: {
              increment: Number(existingDetail.unitPrice) * quantityDiff,
            },
          },
        });

        return updatedDetail;
      });

      return this.mapSaleDetailToResponse(result);
    }

    const updatedDetail = await this.prisma.saleDetail.update({
      where: { id },
      data: updateSaleDetailDto,
      include: {
        product: true,
      },
    });

    return this.mapSaleDetailToResponse(updatedDetail);
  }

  /**
   * Removes a sale detail and restores product stock
   * @param id - ID of the sale detail to remove
   * @throws NotFoundException if sale detail doesn't exist
   */
  async remove(id: number): Promise<void> {
    const detail = await this.prisma.saleDetail.findUnique({
      where: { id },
      include: {
        product: true,
        sale: true,
      },
    });

    if (!detail) {
      throw new NotFoundException(`Sale detail with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: detail.productId },
        data: {
          currentStock: {
            increment: detail.quantity,
          },
        },
      });

      await tx.sale.update({
        where: { id: detail.saleId },
        data: {
          totalAmount: {
            decrement: Number(detail.unitPrice) * detail.quantity,
          },
        },
      });

      await tx.saleDetail.delete({
        where: { id },
      });
    });
  }
}
