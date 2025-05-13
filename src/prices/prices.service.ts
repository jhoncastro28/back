import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';

@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPriceDto: CreatePriceDto) {
    // First, check if the product exists
    const productExists = await this.prisma.product.findUnique({
      where: { id: createPriceDto.productId },
    });

    if (!productExists) {
      throw new NotFoundException(
        `Product with ID ${createPriceDto.productId} not found`,
      );
    }

    // If this is set as the current price, update any existing current prices
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

    // Create the new price
    return this.prisma.price.create({
      data: createPriceDto,
    });
  }

  async findAll(filters: FilterPriceDto = {}) {
    const { productId, isCurrentPrice, page = 1, limit = 10 } = filters;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (isCurrentPrice !== undefined) {
      where.isCurrentPrice = isCurrentPrice;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total price count for these filters
    const total = await this.prisma.price.count({ where });

    // Get paginated prices
    const prices = await this.prisma.price.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data: prices,
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

  async update(id: number, updatePriceDto: UpdatePriceDto) {
    // Check if the price exists
    const existingPrice = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!existingPrice) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    // If updating to make this the current price, update any other current prices
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

    // Update the price
    return this.prisma.price.update({
      where: { id },
      data: updatePriceDto,
    });
  }

  async remove(id: number) {
    // Check if the price exists
    const price = await this.prisma.price.findUnique({
      where: { id },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    // Check if this is the current price
    if (price.isCurrentPrice) {
      throw new Error(
        'Cannot delete the current price. Create a new price or update another price to be current first.',
      );
    }

    // Delete the price
    await this.prisma.price.delete({
      where: { id },
    });
  }

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
