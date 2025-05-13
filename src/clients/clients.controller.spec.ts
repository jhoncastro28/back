import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CreateClientDto, FilterClientDto, UpdateClientDto } from './dto';

describe('ClientsController', () => {
  let controller: ClientsController;
  let clientsService: ClientsService;

  // Mock responses
  const mockClientResponse = {
    message: 'Client created successfully',
    client: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1 555-123-4567',
      address: '123 Main St',
      documentType: 'CC',
      documentNumber: '1234567890',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPaginatedClients = {
    data: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1 555-123-4567',
        address: '123 Main St',
        documentType: 'CC',
        documentNumber: '1234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Clients retrieved successfully',
  };

  const mockDeactivatedClientResponse = {
    message: 'Client deactivated successfully',
    client: {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1 555-123-4567',
      address: '123 Main St',
      documentType: 'CC',
      documentNumber: '1234567890',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPurchaseHistoryResponse = {
    data: [
      {
        id: 1,
        saleDate: new Date('2023-06-15'),
        totalAmount: 750,
        clientId: 1,
        userId: 'user-123',
        saleDetails: [
          {
            id: 1,
            quantity: 3,
            unitPrice: 150,
            subtotal: 450,
            productId: 1,
            saleId: 1,
            product: {
              id: 1,
              name: 'Product 1',
            },
          },
          {
            id: 2,
            quantity: 2,
            unitPrice: 150,
            subtotal: 300,
            productId: 2,
            saleId: 1,
            product: {
              id: 2,
              name: 'Product 2',
            },
          },
        ],
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      clientId: 1,
      clientName: 'John Doe',
    },
    message: 'Purchase history retrieved successfully',
  };

  const mockPurchaseReportResponse = {
    data: {
      client: {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      summary: {
        totalPurchases: 5,
        totalSpent: 2500,
        averagePurchaseValue: 500,
        firstPurchaseDate: new Date('2023-01-15'),
        lastPurchaseDate: new Date('2023-06-20'),
        averageDaysBetweenPurchases: 31.25,
        period: 'all',
      },
      favoriteProducts: [
        {
          productId: 1,
          name: 'Product 1',
          count: 5,
          totalQuantity: 15,
          totalSpent: 1500,
        },
      ],
      mostValuedProducts: [
        {
          productId: 1,
          name: 'Product 1',
          count: 5,
          totalQuantity: 15,
          totalSpent: 1500,
        },
      ],
      recentPurchases: [],
    },
    message: 'Purchase report generated successfully',
  };

  // Mock DTOs
  const mockCreateClientDto: CreateClientDto = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
    documentType: 'CC' as any,
    documentNumber: '1234567890',
  };

  const mockUpdateClientDto: UpdateClientDto = {
    email: 'updated.email@example.com',
  };

  const mockFilterClientDto: FilterClientDto = {
    page: 1,
    limit: 10,
    name: 'John',
    hasPurchased: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockClientResponse),
            findAll: jest.fn().mockResolvedValue(mockPaginatedClients),
            findOne: jest.fn().mockResolvedValue(mockClientResponse),
            update: jest.fn().mockResolvedValue(mockClientResponse),
            toggleActive: jest
              .fn()
              .mockResolvedValue(mockDeactivatedClientResponse),
            getPurchaseHistory: jest
              .fn()
              .mockResolvedValue(mockPurchaseHistoryResponse),
            generatePurchaseReport: jest
              .fn()
              .mockResolvedValue(mockPurchaseReportResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    clientsService = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const result = await controller.create(mockCreateClientDto);
      expect(clientsService.create).toHaveBeenCalledWith(mockCreateClientDto);
      expect(result).toEqual(mockClientResponse);
    });
  });

  describe('findAll', () => {
    it('should return paginated clients with filters', async () => {
      const result = await controller.findAll(mockFilterClientDto);
      expect(clientsService.findAll).toHaveBeenCalledWith(mockFilterClientDto);
      expect(result).toEqual(mockPaginatedClients);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      const result = await controller.findOne(1);
      expect(clientsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockClientResponse);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const result = await controller.update(1, mockUpdateClientDto);
      expect(clientsService.update).toHaveBeenCalledWith(
        1,
        mockUpdateClientDto,
      );
      expect(result).toEqual(mockClientResponse);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a client', async () => {
      const result = await controller.deactivate(1);
      expect(clientsService.toggleActive).toHaveBeenCalledWith(1, {
        isActive: false,
      });
      expect(result).toEqual(mockDeactivatedClientResponse);
    });
  });

  describe('getPurchaseHistory', () => {
    it('should return purchase history for a client', async () => {
      const clientId = 1;
      const dateFrom = '2023-01-01';
      const dateTo = '2023-12-31';
      const page = 1;
      const limit = 10;

      const result = await controller.getPurchaseHistory(
        clientId,
        dateFrom,
        dateTo,
        page,
        limit,
      );

      expect(clientsService.getPurchaseHistory).toHaveBeenCalledWith(clientId, {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        page,
        limit,
      });
      expect(result).toEqual(mockPurchaseHistoryResponse);
    });

    it('should handle undefined date parameters', async () => {
      const clientId = 1;
      const page = 1;
      const limit = 10;

      await controller.getPurchaseHistory(
        clientId,
        undefined,
        undefined,
        page,
        limit,
      );

      expect(clientsService.getPurchaseHistory).toHaveBeenCalledWith(clientId, {
        dateFrom: undefined,
        dateTo: undefined,
        page,
        limit,
      });
    });
  });

  describe('getPurchaseReport', () => {
    it('should return purchase report for a client with period', async () => {
      const clientId = 1;
      const period = 'month';

      const result = await controller.getPurchaseReport(clientId, period);

      expect(clientsService.generatePurchaseReport).toHaveBeenCalledWith(
        clientId,
        period,
      );
      expect(result).toEqual(mockPurchaseReportResponse);
    });

    it('should use default period if not provided', async () => {
      const clientId = 1;

      await controller.getPurchaseReport(clientId);

      expect(clientsService.generatePurchaseReport).toHaveBeenCalledWith(
        clientId,
        'all',
      );
    });
  });
});
