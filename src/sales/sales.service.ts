import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, userId: string) {
    const { details, ...saleData } = createSaleDto;

    // Verify if client exists
    const clientExists = await this.prisma.client.findUnique({
      where: { id: saleData.clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(
        `Client with id ${saleData.clientId} not found`,
      );
    }

    // Calculate total amount and validate products
    let totalAmount = 0;

    for (const detail of details) {
      // Verify if product exists and has enough stock
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

      // Calculate subtotal for this item
      const subtotal =
        detail.unitPrice * detail.quantity - (detail.discountAmount || 0);
      totalAmount += subtotal;
    }

    // Create sale and details in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create the sale
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

      // Create inventory movements for each product
      for (const detail of details) {
        // Update product stock
        await prisma.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              decrement: detail.quantity,
            },
          },
        });

        // Create inventory movement
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

  async findAll(params: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    clientId?: number;
  }) {
    const { page = 1, limit = 10, startDate, endDate, clientId } = params;
    const skip = (page - 1) * limit;

    // Build where condition based on filters - usando any como tipo temporal
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

    // Get total count for pagination
    const total = await this.prisma.sale.count({ where });

    // Get sales with pagination
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

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
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
                description: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    return sale;
  }

  async getSaleDetails(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                currentStock: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    return sale.saleDetails;
  }

  /**
   * Get all purchases/sales for a specific client
   */
  async findByClient(
    clientId: number,
    params: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      includeDetails?: boolean;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      includeDetails = false,
    } = params;
    const skip = (page - 1) * limit;

    // Verify if client exists
    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    // Build where condition - usando any como tipo temporal
    const where: any = {
      clientId,
    };

    // Add date filters if provided
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

    // Get total count for pagination
    const total = await this.prisma.sale.count({ where });

    // Define include object based on whether details are requested
    const include = {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          documentType: true,
          documentNumber: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      ...(includeDetails && {
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      }),
    };

    // Get sales
    const sales = await this.prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        saleDate: 'desc',
      },
      include,
    });

    // Calculate summary statistics
    const summary = await this.getClientPurchaseSummary(
      clientId,
      startDate,
      endDate,
    );

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      summary,
      client: clientExists,
    };
  }

  /**
   * Get purchase summary for a specific client
   */
  async getClientPurchaseSummary(
    clientId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Verify if client exists
    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    // Build where condition for aggregations - usando any como tipo temporal
    const where: any = {
      clientId,
    };

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

    // Get aggregated data
    const [totalSales, totalAmount, averageAmount, lastPurchase] =
      await Promise.all([
        // Total number of sales
        this.prisma.sale.count({ where }),

        // Sum of total amounts
        this.prisma.sale.aggregate({
          where,
          _sum: {
            totalAmount: true,
          },
        }),

        // Average amount
        this.prisma.sale.aggregate({
          where,
          _avg: {
            totalAmount: true,
          },
        }),

        // Last purchase
        this.prisma.sale.findFirst({
          where,
          orderBy: {
            saleDate: 'desc',
          },
          select: {
            id: true,
            saleDate: true,
            totalAmount: true,
          },
        }),
      ]);

    // Get most purchased products
    const mostPurchasedProducts = await this.prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: where,
      },
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Get product details for most purchased products
    const productDetails = await Promise.all(
      mostPurchasedProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
          },
        });
        return {
          product,
          totalQuantity: item._sum.quantity,
          timesPurchased: item._count.productId,
        };
      }),
    );

    return {
      totalSales,
      totalAmount: totalAmount._sum.totalAmount || 0,
      averageAmount: averageAmount._avg.totalAmount || 0,
      lastPurchase,
      mostPurchasedProducts: productDetails,
    };
  }

  async update(id: number, updateSaleDto: UpdateSaleDto) {
    // Check if sale exists
    const saleExists = await this.prisma.sale.findUnique({
      where: { id },
    });

    if (!saleExists) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    // If clientId is provided, verify if client exists
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

    // Update the sale
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
          },
        },
      },
    });

    return updatedSale;
  }

  async remove(id: number) {
    // Check if sale exists
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        saleDetails: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with id ${id} not found`);
    }

    // Remove the sale and its details in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Restore inventory for each product
      for (const detail of sale.saleDetails) {
        // Update product stock
        await prisma.product.update({
          where: { id: detail.productId },
          data: {
            currentStock: {
              increment: detail.quantity,
            },
          },
        });

        // Delete inventory movements related to this sale
        await prisma.inventoryMovement.deleteMany({
          where: { saleId: id },
        });
      }

      // Delete sale details
      await prisma.saleDetail.deleteMany({
        where: { saleId: id },
      });

      // Delete the sale
      return prisma.sale.delete({
        where: { id },
      });
    });
  }
}
