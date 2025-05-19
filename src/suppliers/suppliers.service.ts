import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto, SearchSupplierDto } from './dto';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const supplier = await this.prisma.supplier.create({
        data: createSupplierDto,
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
          _count: {
            select: {
              products: true,
              inventoryMovements: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Error creating supplier: Invalid data provided',
        );
      }
      throw error;
    }
  }

  async findAll(query: SearchSupplierDto) {
    const { isActive, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
          _count: {
            select: {
              products: true,
              inventoryMovements: true,
            },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: suppliers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            prices: {
              where: { isCurrentPrice: true },
              select: {
                purchasePrice: true,
                sellingPrice: true,
              },
            },
          },
        },
        inventoryMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            inventoryMovements: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return {
      success: true,
      data: supplier,
    };
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    try {
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: updateSupplierDto,
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
          _count: {
            select: {
              products: true,
              inventoryMovements: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Supplier not found');
        }
        throw new BadRequestException(
          'Error updating supplier: Invalid data provided',
        );
      }
      throw error;
    }
  }

  async deactivate(id: number) {
    try {
      // Check if supplier has active products
      const activeProducts = await this.prisma.product.count({
        where: {
          supplierId: id,
          isActive: true,
        },
      });

      if (activeProducts > 0) {
        return {
          success: false,
          message: `Cannot deactivate supplier. There are ${activeProducts} active products associated with this supplier.`,
          data: null,
        };
      }

      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Supplier deactivated successfully',
        data: supplier,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Supplier not found');
        }
      }
      throw error;
    }
  }

  async reactivate(id: number) {
    try {
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Supplier reactivated successfully',
        data: supplier,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Supplier not found');
        }
      }
      throw error;
    }
  }
}
