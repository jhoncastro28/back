import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto, FilterDiscountDto, UpdateDiscountDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Creates a new discount for a specific price
   * @param createDiscountDto - The data to create the discount
   * @throws NotFoundException - If the price doesn't exist
   * @returns The created discount with its associated price and product
   */
  async create(createDiscountDto: CreateDiscountDto) {
    const priceExists = await this.prisma.price.findUnique({
      where: { id: createDiscountDto.priceId },
    });

    if (!priceExists) {
      throw new NotFoundException(
        `Price with ID ${createDiscountDto.priceId} not found`,
      );
    }

    const data = {
      ...createDiscountDto,
      startDate: new Date(createDiscountDto.startDate),
      endDate: createDiscountDto.endDate
        ? new Date(createDiscountDto.endDate)
        : null,
    };

    return this.prisma.discount.create({
      data,
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves all discounts with optional filtering and pagination
   * @param filters - Optional filters including name, type, dates, status, and pagination parameters
   * @returns Paginated response containing filtered discounts
   */
  async findAll(
    filters: FilterDiscountDto = {},
  ): Promise<PaginatedResponse<any>> {
    const {
      name,
      type,
      isActive,
      priceId,
      startDateFrom,
      startDateTo,
      endDateFrom,
      endDateTo,
      isCurrentlyValid,
      page = 1,
      limit = 10,
    } = filters;

    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (type !== undefined) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (priceId) {
      where.priceId = priceId;
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {};

      if (startDateFrom) {
        where.startDate.gte = new Date(startDateFrom);
      }

      if (startDateTo) {
        where.startDate.lte = new Date(startDateTo);
      }
    }

    if (endDateFrom || endDateTo) {
      where.endDate = {};

      if (endDateFrom) {
        where.endDate.gte = new Date(endDateFrom);
      }

      if (endDateTo) {
        where.endDate.lte = new Date(endDateTo);
      }
    }

    if (isCurrentlyValid !== undefined) {
      const now = new Date();

      if (isCurrentlyValid) {
        where.AND = [
          {
            startDate: {
              lte: now,
            },
          },
          {
            OR: [
              {
                endDate: null,
              },
              {
                endDate: {
                  gte: now,
                },
              },
            ],
          },
        ];
      } else {
        where.OR = [
          {
            startDate: {
              gt: now,
            },
          },
          {
            endDate: {
              lt: now,
            },
          },
        ];
      }
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    const [discounts, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        skip,
        take: limit,
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return this.paginationService.createPaginationObject(
      discounts,
      total,
      page,
      limit,
      'Discounts retrieved successfully',
    );
  }

  /**
   * Retrieves a specific discount by its ID
   * @param id - The ID of the discount to find
   * @throws NotFoundException - If the discount doesn't exist
   * @returns The discount with its associated price and product
   */
  async findOne(id: number) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  /**
   * Updates an existing discount
   * @param id - The ID of the discount to update
   * @param updateDiscountDto - The data to update the discount
   * @throws NotFoundException - If the discount doesn't exist
   * @returns The updated discount with its associated price and product
   */
  async update(id: number, updateDiscountDto: UpdateDiscountDto) {
    const existingDiscount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    const data: any = { ...updateDiscountDto };

    if (updateDiscountDto.startDate) {
      data.startDate = new Date(updateDiscountDto.startDate);
    }

    if (updateDiscountDto.endDate) {
      data.endDate = new Date(updateDiscountDto.endDate);
    }

    return this.prisma.discount.update({
      where: { id },
      data,
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Removes a discount from the system
   * @param id - The ID of the discount to remove
   * @throws NotFoundException - If the discount doesn't exist
   */
  async remove(id: number) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    await this.prisma.discount.delete({
      where: { id },
    });
  }

  /**
   * Retrieves all currently valid discounts for a specific price
   * @param priceId - The ID of the price to get current discounts for
   * @throws NotFoundException - If the price doesn't exist
   * @returns Array of currently valid discounts for the specified price
   */
  async getCurrentDiscounts(priceId: number) {
    const priceExists = await this.prisma.price.findUnique({
      where: { id: priceId },
    });

    if (!priceExists) {
      throw new NotFoundException(`Price with ID ${priceId} not found`);
    }

    const now = new Date();

    return this.prisma.discount.findMany({
      where: {
        priceId,
        isActive: true,
        startDate: {
          lte: now,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: now,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
