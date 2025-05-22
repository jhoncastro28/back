import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PaginatedResult } from '../common/interfaces';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClientDto,
  FilterClientDto,
  ToggleActiveDto,
  UpdateClientDto,
  LoginClientDto,
} from './dto';

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
  ) {}

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

    // Generate a JWT token
    const token = this.jwtService.sign(
      {
        sub: client.id,
        type: 'client', // Mark as client token to differentiate from user tokens
        documentType: client.documentType,
        documentNumber: client.documentNumber,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    return {
      message: 'Login successful',
      user: {
        // We're using "user" as the property to maintain compatibility with the existing auth response structure
        id: client.id,
        firstName: client.name.split(' ')[0],
        lastName: client.name.split(' ').slice(1).join(' '),
        email: client.email || '',
        documentType: client.documentType,
        documentNumber: client.documentNumber,
        role: 'CLIENT', // Special role for clients
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      token,
    };
  }

  /**
   * Create a new client
   *
   * @param createClientDto - Data for creating a new client
   * @returns Newly created client with success message
   */
  async create(createClientDto: CreateClientDto) {
    try {
      // Create new client
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
   * Retrieve all clients with pagination and filtering
   *
   * @param filterClientDto - Pagination and filter parameters
   * @returns Paginated list of clients
   */
  async findAll(
    filterClientDto: FilterClientDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      name,
      email,
      phoneNumber,
      identificationNumber,
      isActive = true,
      hasPurchased,
    } = filterClientDto;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    try {
      // Build where clause with filters
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

      if (identificationNumber) {
        where.documentNumber = identificationNumber;
      }

      // If hasPurchased filter is used, we need to include a relation check
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

      // Get clients with pagination
      const clients = await this.prismaService.client.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include,
      });

      // Filter clients with sales if hasPurchased flag is set
      let filteredClients = clients;
      if (hasPurchased !== undefined) {
        filteredClients = clients.filter((client) => {
          const hasSales = client.sales && client.sales.length > 0;
          return hasPurchased ? hasSales : !hasSales;
        });

        // Remove the sales information from the response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filteredClients = filteredClients.map(({ sales, ...client }) => client);
      }

      // Get total count for pagination metadata
      const total = await this.prismaService.client.count({ where });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return {
        data: filteredClients,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        message: 'Clients retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error retrieving clients: ' + error.message,
      );
    }
  }

  /**
   * Find a client by ID
   *
   * @param id - Client's unique identifier
   * @returns Client information with success message
   * @throws NotFoundException if client is not found or inactive
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
   * Update a client's information
   *
   * @param id - Client's unique identifier
   * @param updateClientDto - Data to update
   * @returns Updated client with success message
   * @throws NotFoundException if client is not found or inactive
   */
  async update(id: number, updateClientDto: UpdateClientDto) {
    try {
      // Check if client exists
      const existingClient = await this.prismaService.client.findUnique({
        where: { id },
      });

      if (!existingClient || !existingClient.isActive) {
        throw new NotFoundException(
          `Client with ID ${id} not found or inactive`,
        );
      }

      // Update the client
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
   * Activate or deactivate a client
   *
   * @param id - Client's unique identifier
   * @param toggleActiveDto - Data containing isActive flag
   * @returns Updated client with success message
   * @throws NotFoundException if client is not found
   */
  async toggleActive(id: number, toggleActiveDto: ToggleActiveDto) {
    try {
      // Check if client exists
      const existingClient = await this.prismaService.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      // Update the active status of the client
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
   * Get purchase history for a specific client
   *
   * @param id - Client's unique identifier
   * @param options - Options for filtering and pagination
   * @returns Paginated list of client purchases with product details
   * @throws NotFoundException if client is not found or inactive
   */
  async getPurchaseHistory(
    id: number,
    options: {
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const { dateFrom, dateTo, page = 1, limit = 10 } = options;

    // Check if client exists and is active
    const client = await this.prismaService.client.findUnique({
      where: { id },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(`Client with ID ${id} not found or inactive`);
    }

    // Build date filter if provided
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = dateFrom;
    }
    if (dateTo) {
      dateFilter.lte = dateTo;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    try {
      // Get purchases for this client
      const sales = await this.prismaService.sale.findMany({
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
      });

      // Get total count for pagination
      const total = await this.prismaService.sale.count({
        where: {
          clientId: id,
          ...(Object.keys(dateFilter).length > 0
            ? { saleDate: dateFilter }
            : {}),
        },
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return {
        data: sales,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          clientId: id,
          clientName: client.name,
        },
        message: 'Purchase history retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error retrieving purchase history: ' + error.message,
      );
    }
  }

  /**
   * Generate a purchase report for a specific client
   *
   * @param id - Client's unique identifier
   * @param period - Time period for the report
   * @returns Summary report of client's purchase patterns
   * @throws NotFoundException if client is not found or inactive
   */
  async generatePurchaseReport(
    id: number,
    period: 'month' | 'quarter' | 'year' | 'all' = 'all',
  ) {
    // Check if client exists and is active
    const client = await this.prismaService.client.findUnique({
      where: { id },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(`Client with ID ${id} not found or inactive`);
    }

    // Calculate date range based on period
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
      // Get all sales for this client within the specified period
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

      // Calculate summary statistics
      const totalPurchases = sales.length;
      const totalSpent = sales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount),
        0,
      );
      const averagePurchaseValue =
        totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      // Track product purchases to identify favorites
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

      // Process all sale items
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

      // Convert to array and find favorite products
      const productsArray = Object.values(productPurchases);

      // Sort by purchase frequency
      const favoriteProducts = productsArray
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sort by total spent
      const mostValuedProducts = productsArray
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Get purchase dates to analyze frequency
      const purchaseDates = sales.map((sale) => new Date(sale.saleDate));
      purchaseDates.sort((a, b) => a.getTime() - b.getTime());

      // Calculate days between purchases
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

      // First and last purchase dates
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
