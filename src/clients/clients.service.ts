import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClientDto,
  FilterClientDto,
  LoginClientDto,
  ToggleActiveDto,
  UpdateClientDto,
} from './dto';
import { PurchaseHistoryResponse } from './interfaces/purchase-history.interface';

/**
 * Client Service
 *
 * Handles all business logic related to client operations
 * including CRUD operations and activation/deactivation.
 */
@Injectable()
export class ClientsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Authenticates a client using document credentials
   * @param loginClientDto - The client's document credentials
   * @returns Authentication token and client information
   * @throws NotFoundException when client is not found or inactive
   */
  async loginWithDocument(loginClientDto: LoginClientDto) {
    const { documentType, documentNumber } = loginClientDto;

    // Find client with matching document
    const client = await this.prismaService.client.findFirst({
      where: {
        documentType,
        documentNumber,
        isActive: true,
      },
    });

    if (!client) {
      throw new NotFoundException(
        `Client with document ${documentType} ${documentNumber} not found or inactive`,
      );
    }

    const token = this.jwtService.sign({
      sub: client.id,
      type: 'client',
      documentType: client.documentType,
      documentNumber: client.documentNumber,
    });

    return {
      message: 'Login successful',
      user: {
        id: client.id,
        firstName: client.name.split(' ')[0],
        lastName: client.name.split(' ').slice(1).join(' '),
        email: client.email || '',
        documentType: client.documentType,
        documentNumber: client.documentNumber,
        role: 'CLIENT',
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      token,
    };
  }

  /**
   * Get orders for a specific client
   */
  // Mobile client methods have been moved to src/clients/mobile/mobile.service.ts

  /**
   * Creates a new client in the system
   * @param createClientDto - Data for creating a new client
   * @returns Newly created client with success message
   * @throws BadRequestException if client creation fails
   */
  async create(createClientDto: CreateClientDto) {
    try {
      const newClient = await this.prismaService.client.create({
        data: createClientDto,
      });

      return {
        message: 'Client created successfully',
        client: newClient,
      };
    } catch (error) {
      throw new BadRequestException('Error creating client: ' + error.message);
    }
  }

  /**
   * Retrieves all clients with pagination and filtering options
   * @param filterClientDto - Pagination and filter parameters
   * @returns Paginated list of clients
   * @throws BadRequestException if retrieval fails
   */
  async findAll(
    filterClientDto: FilterClientDto,
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      name,
      email,
      phoneNumber,
      documentNumber,
      isActive = true,
      hasPurchased,
    } = filterClientDto;

    const skip = this.paginationService.getPaginationSkip(page, limit);

    try {
      const where: any = {
        isActive,
      };

      if (name) {
        where.name = {
          contains: name,
          mode: 'insensitive',
        };
      }

      if (email) {
        where.email = email;
      }

      if (phoneNumber) {
        where.phoneNumber = {
          contains: phoneNumber,
          mode: 'insensitive',
        };
      }

      if (documentNumber) {
        where.documentNumber = documentNumber;
      }

      let include = undefined;
      if (hasPurchased !== undefined) {
        include = {
          sales: {
            select: {
              id: true,
            },
            take: 1,
          },
        };
      }

      const [clients, total] = await Promise.all([
        this.prismaService.client.findMany({
          skip,
          take: limit,
          where,
          orderBy: {
            createdAt: 'desc',
          },
          include,
        }),
        this.prismaService.client.count({ where }),
      ]);

      let filteredClients = clients;
      if (hasPurchased !== undefined) {
        filteredClients = clients.filter((client) => {
          const hasSales = client.sales && client.sales.length > 0;
          return hasPurchased ? hasSales : !hasSales;
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filteredClients = filteredClients.map(({ sales, ...client }) => client);
      }

      return this.paginationService.createPaginationObject(
        filteredClients,
        total,
        page,
        limit,
        'Clients retrieved successfully',
      );
    } catch (error) {
      throw new BadRequestException(
        'Error retrieving clients: ' + error.message,
      );
    }
  }

  /**
   * Retrieves a single client by their ID
   * @param id - Client's unique identifier
   * @returns Client information with success message
   * @throws NotFoundException if client is not found or inactive
   * @throws BadRequestException if retrieval fails
   */
  async findOne(id: number) {
    try {
      const client = await this.prismaService.client.findUnique({
        where: { id },
      });

      if (!client || !client.isActive) {
        throw new NotFoundException(
          `Client with ID ${id} not found or inactive`,
        );
      }

      return {
        client,
        message: 'Client found successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error retrieving client: ' + error.message,
      );
    }
  }

  /**
   * Updates a client's information
   * @param id - Client's unique identifier
   * @param updateClientDto - Data to update
   * @returns Updated client with success message
   * @throws NotFoundException if client is not found or inactive
   * @throws BadRequestException if update fails
   */
  async update(id: number, updateClientDto: UpdateClientDto) {
    try {
      const existingClient = await this.prismaService.client.findUnique({
        where: { id },
      });

      if (!existingClient || !existingClient.isActive) {
        throw new NotFoundException(
          `Client with ID ${id} not found or inactive`,
        );
      }

      const updatedClient = await this.prismaService.client.update({
        where: { id },
        data: updateClientDto,
      });

      return {
        message: 'Client updated successfully',
        client: updatedClient,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error updating client: ' + error.message);
    }
  }

  /**
   * Activates or deactivates a client
   * @param id - Client's unique identifier
   * @param toggleActiveDto - Data containing isActive flag
   * @returns Updated client with success message
   * @throws NotFoundException if client is not found
   * @throws BadRequestException if status update fails
   */
  async toggleActive(id: number, toggleActiveDto: ToggleActiveDto) {
    try {
      const existingClient = await this.prismaService.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const updatedClient = await this.prismaService.client.update({
        where: { id },
        data: {
          isActive: toggleActiveDto.isActive,
        },
      });

      return {
        message: toggleActiveDto.isActive
          ? 'Client activated successfully'
          : 'Client deactivated successfully',
        client: updatedClient,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error updating client status: ' + error.message,
      );
    }
  }

  /**
   * Retrieves purchase history for a specific client with filtering and pagination
   * @param id - Client's unique identifier
   * @param options - Options for filtering and pagination
   * @returns Paginated list of client purchases with product details
   * @throws NotFoundException if client is not found or inactive
   * @throws BadRequestException if retrieval fails
   */
  async getPurchaseHistory(
    id: number,
    options: {
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<PurchaseHistoryResponse<any>> {
    const { dateFrom, dateTo, page = 1, limit = 10 } = options;

    const client = await this.prismaService.client.findUnique({
      where: { id },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(`Client with ID ${id} not found or inactive`);
    }

    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = dateFrom;
    }
    if (dateTo) {
      dateFilter.lte = dateTo;
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    try {
      const [sales, total] = await Promise.all([
        this.prismaService.sale.findMany({
          where: {
            clientId: id,
            ...(Object.keys(dateFilter).length > 0
              ? { saleDate: dateFilter }
              : {}),
          },
          include: {
            saleDetails: {
              include: {
                product: true,
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
          },
          orderBy: {
            saleDate: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prismaService.sale.count({
          where: {
            clientId: id,
            ...(Object.keys(dateFilter).length > 0
              ? { saleDate: dateFilter }
              : {}),
          },
        }),
      ]);

      const response = this.paginationService.createPaginationObject(
        sales,
        total,
        page,
        limit,
        'Purchase history retrieved successfully',
      );

      return {
        ...response,
        meta: {
          ...response.meta,
          clientId: id,
          clientName: client.name,
        },
      } as PurchaseHistoryResponse<any>;
    } catch (error) {
      throw new BadRequestException(
        'Error retrieving purchase history: ' + error.message,
      );
    }
  }

  /**
   * Generates a purchase report for a specific client
   * @param id - Client's unique identifier
   * @param period - Time period for the report ('month' | 'quarter' | 'year' | 'all')
   * @returns Summary report of client's purchase patterns
   * @throws NotFoundException if client is not found or inactive
   * @throws BadRequestException if report generation fails
   */
  async generatePurchaseReport(
    id: number,
    period: 'month' | 'quarter' | 'year' | 'all' = 'all',
  ) {
    const client = await this.prismaService.client.findUnique({
      where: { id },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(`Client with ID ${id} not found or inactive`);
    }

    const now = new Date();
    let dateFrom: Date | undefined;

    if (period === 'month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === 'quarter') {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (period === 'year') {
      dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    try {
      const sales = await this.prismaService.sale.findMany({
        where: {
          clientId: id,
          ...(dateFrom ? { saleDate: { gte: dateFrom } } : {}),
        },
        include: {
          saleDetails: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
      });

      const totalPurchases = sales.length;
      const totalSpent = sales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount),
        0,
      );
      const averagePurchaseValue =
        totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      const productPurchases: Record<
        number,
        {
          productId: number;
          name: string;
          count: number;
          totalQuantity: number;
          totalSpent: number;
        }
      > = {};

      sales.forEach((sale) => {
        sale.saleDetails.forEach((item) => {
          const productId = item.productId;
          if (!productPurchases[productId]) {
            productPurchases[productId] = {
              productId,
              name: item.product.name,
              count: 0,
              totalQuantity: 0,
              totalSpent: 0,
            };
          }

          productPurchases[productId].count++;
          productPurchases[productId].totalQuantity += item.quantity;
          productPurchases[productId].totalSpent +=
            Number(item.unitPrice) * item.quantity;
        });
      });

      const productsArray = Object.values(productPurchases);

      const favoriteProducts = productsArray
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const mostValuedProducts = productsArray
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      const purchaseDates = sales.map((sale) => new Date(sale.saleDate));
      purchaseDates.sort((a, b) => a.getTime() - b.getTime());

      let totalDaysBetween = 0;
      let daysBetweenCount = 0;

      for (let i = 1; i < purchaseDates.length; i++) {
        const daysBetween = Math.round(
          (purchaseDates[i].getTime() - purchaseDates[i - 1].getTime()) /
            (1000 * 60 * 60 * 24),
        );
        totalDaysBetween += daysBetween;
        daysBetweenCount++;
      }

      const averageDaysBetweenPurchases =
        daysBetweenCount > 0 ? totalDaysBetween / daysBetweenCount : 0;

      const firstPurchaseDate =
        purchaseDates.length > 0 ? purchaseDates[0] : null;
      const lastPurchaseDate =
        purchaseDates.length > 0
          ? purchaseDates[purchaseDates.length - 1]
          : null;

      return {
        data: {
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
          },
          summary: {
            totalPurchases,
            totalSpent,
            averagePurchaseValue,
            firstPurchaseDate,
            lastPurchaseDate,
            averageDaysBetweenPurchases,
            period,
            dateFrom,
            dateTo: now,
          },
          favoriteProducts,
          mostValuedProducts,
          recentPurchases: sales.slice(0, 5),
        },
        message: 'Purchase report generated successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error generating purchase report: ' + error.message,
      );
    }
  }
}
