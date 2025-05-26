import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, SearchSupplierDto, UpdateSupplierDto } from './dto';
import {
  ISupplierListResponse,
  ISupplierResponse,
} from './interfaces/supplier.interface';

/**
 * Service responsible for managing supplier operations
 * Handles supplier creation, updates, deactivation, and reactivation
 */
@Injectable()
export class SuppliersService {
  private readonly DEFAULT_SUPPLIER_INCLUDE = {
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
  } as const;

  private readonly SUPPLIER_DETAIL_INCLUDE = {
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
        product: { select: { name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    },
    _count: {
      select: {
        products: true,
        inventoryMovements: true,
      },
    },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Creates a new supplier in the system
   * @param createSupplierDto - Data for creating the supplier
   * @returns Created supplier with associated products count
   * @throws BadRequestException if supplier with same information exists
   * @throws InternalServerErrorException for unexpected errors
   */
  async create(
    createSupplierDto: CreateSupplierDto,
  ): Promise<ISupplierResponse> {
    try {
      const supplier = await this.prisma.supplier.create({
        data: createSupplierDto,
        include: this.DEFAULT_SUPPLIER_INCLUDE,
      });

      return {
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Retrieves all suppliers with optional filtering and pagination
   * @param query - Search parameters including active status, search term, and pagination
   * @returns Paginated list of suppliers with their associated products
   * @throws InternalServerErrorException for unexpected errors
   */
  async findAll(query: SearchSupplierDto): Promise<ISupplierListResponse> {
    try {
      const where = this.buildSupplierSearchQuery(query);
      const { page = 1, limit = 10 } = query;
      const skip = this.paginationService.getPaginationSkip(page, limit);

      const [suppliers, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: this.DEFAULT_SUPPLIER_INCLUDE,
        }),
        this.prisma.supplier.count({ where }),
      ]);

      return this.paginationService.createPaginationObject(
        suppliers,
        total,
        page,
        limit,
        'Suppliers retrieved successfully',
      );
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Retrieves a specific supplier by ID with detailed information
   * @param id - ID of the supplier to retrieve
   * @returns Supplier with products, prices, and recent inventory movements
   * @throws NotFoundException if supplier doesn't exist
   * @throws InternalServerErrorException for unexpected errors
   */
  async findOne(id: number): Promise<ISupplierResponse> {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id },
        include: this.SUPPLIER_DETAIL_INCLUDE,
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      return {
        success: true,
        data: supplier,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error);
    }
  }

  /**
   * Updates a supplier's information
   * @param id - ID of the supplier to update
   * @param updateSupplierDto - Data for updating the supplier
   * @returns Updated supplier with associated products
   * @throws NotFoundException if supplier doesn't exist
   * @throws BadRequestException if update data is invalid
   * @throws InternalServerErrorException for unexpected errors
   */
  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<ISupplierResponse> {
    try {
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: updateSupplierDto,
        include: this.DEFAULT_SUPPLIER_INCLUDE,
      });

      return {
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Toggles a supplier's active status
   * @param id - ID of the supplier to toggle
   * @param activate - Boolean indicating whether to activate or deactivate the supplier
   * @returns Updated supplier information
   * @throws NotFoundException if supplier doesn't exist
   * @throws BadRequestException if supplier has active products when deactivating
   * @throws InternalServerErrorException for unexpected errors
   */
  async toggleActive(
    id: number,
    activate: boolean,
  ): Promise<ISupplierResponse> {
    try {
      if (!activate) {
        const hasActiveProducts = await this.checkForActiveProducts(id);
        if (hasActiveProducts) {
          return {
            success: false,
            message: `Cannot deactivate supplier. There are ${hasActiveProducts} active products associated with this supplier.`,
            data: null,
          };
        }
      }

      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: { isActive: activate },
        select: {
          id: true,
          name: true,
          isActive: true,
          contactName: true,
          email: true,
          phoneNumber: true,
          address: true,
          documentType: true,
          documentNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: activate
          ? 'Supplier activated successfully'
          : 'Supplier deactivated successfully',
        data: supplier,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  /**
   * Builds the search query for suppliers based on provided filters
   * @param query - Search parameters
   * @returns Prisma where clause for supplier queries
   * @private
   */
  private buildSupplierSearchQuery(query: SearchSupplierDto): any {
    const { isActive, search } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return where;
  }

  /**
   * Checks if a supplier has any active products
   * @param supplierId - ID of the supplier to check
   * @returns Number of active products or false if none
   * @private
   */
  private async checkForActiveProducts(
    supplierId: number,
  ): Promise<number | false> {
    const activeProducts = await this.prisma.product.count({
      where: {
        supplierId,
        isActive: true,
      },
    });
    return activeProducts > 0 ? activeProducts : false;
  }

  /**
   * Handles Prisma errors and throws appropriate HTTP exceptions
   * @param error - Error to handle
   * @throws Various HTTP exceptions based on the error type
   * @private
   */
  private handlePrismaError(error: any): never {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new BadRequestException(
            'A supplier with this information already exists',
          );
        case 'P2025':
          throw new NotFoundException('Supplier not found');
        case 'P2014':
          throw new BadRequestException('Invalid relation data provided');
        default:
          throw new BadRequestException('Invalid data provided');
      }
    }

    throw new InternalServerErrorException(
      'An unexpected error occurred while processing your request',
    );
  }
}
