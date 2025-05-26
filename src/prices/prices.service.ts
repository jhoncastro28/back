import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';

/**
 * Service responsible for managing product prices in the system
 * Handles price creation, updates, and historical price tracking
 */
@Injectable()
export class PricesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Creates a new price record for a product
   * If marked as current price, automatically updates previous current price
   * @param createPriceDto - Data for creating the new price
   * @returns Newly created price record
   * @throws NotFoundException if product does not exist
   */
  async create(createPriceDto: CreatePriceDto) {
    const productExists = await this.prisma.product.findUnique({
      where: { id: createPriceDto.productId },
    });

    if (!productExists) {
      throw new NotFoundException(
        `Product with ID ${createPriceDto.productId} not found`,
      );
    }

    if (createPriceDto.isCurrentPrice) {
      await this.prisma.price.updateMany({
        where: {
          productId: createPriceDto.productId,
          isCurrentPrice: true,
        },
        data: {
          isCurrentPrice: false,
          validTo: new Date(),
        },
      });
    }

    return this.prisma.price.create({
      data: createPriceDto,
    });
  }

  /**
   * Retrieves all prices with optional filtering and pagination
   * @param filters - Optional filters for product ID, current price status, and pagination
   * @returns Paginated list of prices with their associated products
   */
  async findAll(filters: FilterPriceDto = {}) {
    const { productId, isCurrentPrice, page = 1, limit = 10 } = filters;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (isCurrentPrice !== undefined) {
      where.isCurrentPrice = isCurrentPrice;
    }

    const total = await this.prisma.price.count({ where });

    const prices = await this.prisma.price.findMany({
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

    return this.paginationService.createPaginationObject(
      prices,
      total,
      page,
      limit,
      'Prices retrieved successfully',
    );
  }

  /**
   * Retrieves a specific price record by ID
   * @param id - ID of the price to retrieve
   * @returns Price record with associated product and discounts
   * @throws NotFoundException if price does not exist
   */
  async findOne(id: number) {
    const price = await this.prisma.price.findUnique({
      where: { id },
      include: {
        product: true,
        discounts: true,
      },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    return price;
  }

  /**
   * Updates an existing price record
   * If updating to current price, automatically updates previous current price
   * @param id - ID of the price to update
   * @param updatePriceDto - Data for updating the price
   * @returns Updated price record
   * @throws NotFoundException if price does not exist
   */
  async update(id: number, updatePriceDto: UpdatePriceDto) {
    const existingPrice = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!existingPrice) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    if (updatePriceDto.isCurrentPrice) {
      await this.prisma.price.updateMany({
        where: {
          productId: existingPrice.productId,
          isCurrentPrice: true,
          id: { not: id },
        },
        data: {
          isCurrentPrice: false,
          validTo: new Date(),
        },
      });
    }

    return this.prisma.price.update({
      where: { id },
      data: updatePriceDto,
    });
  }

  /**
   * Removes a price record from the system
   * @param id - ID of the price to remove
   * @throws NotFoundException if price does not exist
   * @throws Error if attempting to delete the current price
   */
  async remove(id: number) {
    const price = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    if (price.isCurrentPrice) {
      throw new Error(
        'Cannot delete the current price. Create a new price or update another price to be current first.',
      );
    }

    await this.prisma.price.delete({
      where: { id },
    });
  }

  /**
   * Retrieves the current price for a specific product
   * @param productId - ID of the product
   * @returns Current price record for the product
   * @throws NotFoundException if product or current price not found
   */
  async getCurrentPriceForProduct(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const currentPrice = await this.prisma.price.findFirst({
      where: {
        productId,
        isCurrentPrice: true,
      },
    });

    if (!currentPrice) {
      throw new NotFoundException(
        `No current price found for product with ID ${productId}`,
      );
    }

    return currentPrice;
  }
}
