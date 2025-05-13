import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto, FilterDiscountDto, UpdateDiscountDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto) {
    // First, check if the price exists
    const priceExists = await this.prisma.price.findUnique({
      where: { id: createDiscountDto.priceId },
    });

    if (!priceExists) {
      throw new NotFoundException(
        `Price with ID ${createDiscountDto.priceId} not found`,
      );
    }

    // Convert dates to Date objects
    const data = {
      ...createDiscountDto,
      startDate: new Date(createDiscountDto.startDate),
      endDate: createDiscountDto.endDate
        ? new Date(createDiscountDto.endDate)
        : null,
    };

    // Create the discount
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

  async findAll(filters: FilterDiscountDto = {}) {
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

    // Date range filters
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

    // Filter for currently valid discounts
    if (isCurrentlyValid !== undefined) {
      const now = new Date();

      if (isCurrentlyValid) {
        // startDate <= now AND (endDate is null OR endDate >= now)
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
        // startDate > now OR endDate < now
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

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total discount count for these filters
    const total = await this.prisma.discount.count({ where });

    // Get paginated discounts
    const discounts = await this.prisma.discount.findMany({
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
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: discounts,
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

  async update(id: number, updateDiscountDto: UpdateDiscountDto) {
    // Check if the discount exists
    const existingDiscount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Prepare data for update
    const data: any = { ...updateDiscountDto };

    // Convert dates to Date objects if provided
    if (updateDiscountDto.startDate) {
      data.startDate = new Date(updateDiscountDto.startDate);
    }

    if (updateDiscountDto.endDate) {
      data.endDate = new Date(updateDiscountDto.endDate);
    }

    // Update the discount
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

  async remove(id: number) {
    // Check if the discount exists
    const discount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Delete the discount
    await this.prisma.discount.delete({
      where: { id },
    });
  }

  async getCurrentDiscounts(priceId: number) {
    // First, check if the price exists
    const priceExists = await this.prisma.price.findUnique({
      where: { id: priceId },
    });

    if (!priceExists) {
      throw new NotFoundException(`Price with ID ${priceId} not found`);
    }

    const now = new Date();

    // Get all valid discounts for this price
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
