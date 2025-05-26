import { Test, TestingModule } from '@nestjs/testing';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CreateClientDto, FilterClientDto, UpdateClientDto } from './dto';
import { LoginClientDto } from './dto/login-client.dto';
import { DocumentType } from './entities/client.entity';

describe('ClientsController', () => {
  let controller: ClientsController;
  let clientsService: ClientsService;
  let toggleActiveService: ToggleActiveService;

  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    address: 'Test Address',
    documentType: DocumentType.CC,
    documentNumber: '12345678',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    message: 'Login successful',
    user: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      documentType: DocumentType.CC,
      documentNumber: '12345678',
      role: 'CLIENT',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    token: 'mock-token',
  };

  const mockPaginatedResponse = {
    data: [mockClient],
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: {
            loginWithDocument: jest.fn().mockResolvedValue(mockLoginResponse),
            create: jest.fn().mockResolvedValue({
              message: 'Client created successfully',
              client: mockClient,
            }),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
            findOne: jest.fn().mockResolvedValue({
              message: 'Client found',
              client: mockClient,
            }),
            update: jest.fn().mockResolvedValue({
              message: 'Client updated successfully',
              client: mockClient,
            }),
            getPurchaseHistory: jest.fn().mockResolvedValue({
              data: [],
              meta: { total: 0, page: 1, limit: 10 },
              message: 'Purchase history retrieved successfully',
            }),
            generatePurchaseReport: jest.fn().mockResolvedValue({
              data: { totalPurchases: 0, totalAmount: 0 },
              message: 'Purchase report generated successfully',
            }),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest.fn().mockImplementation((type, id, data) => {
              if (data.isActive) {
                return Promise.resolve({
                  message: 'Client activated successfully',
                });
              }
              return Promise.resolve({
                message: 'Client deactivated successfully',
              });
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    clientsService = module.get<ClientsService>(ClientsService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(clientsService).toBeDefined();
    expect(toggleActiveService).toBeDefined();
  });

  describe('loginClient', () => {
    it('should login a client with document credentials', async () => {
      const loginDto: LoginClientDto = {
        documentType: DocumentType.CC,
        documentNumber: '12345678',
      };

      const result = await controller.loginClient(loginDto);
      expect(clientsService.loginWithDocument).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const createDto: CreateClientDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        address: 'Test Address',
        documentType: DocumentType.CC,
        documentNumber: '12345678',
      };

      const result = await controller.create(createDto);
      expect(clientsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        message: 'Client created successfully',
        client: mockClient,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const filterDto: FilterClientDto = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      const result = await controller.findAll(filterDto);
      expect(clientsService.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      const result = await controller.findOne(1);
      expect(clientsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Client found',
        client: mockClient,
      });
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updateDto: UpdateClientDto = {
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const result = await controller.update(1, updateDto);
      expect(clientsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({
        message: 'Client updated successfully',
        client: mockClient,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate a client', async () => {
      const result = await controller.deactivate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'client',
        1,
        { isActive: false },
      );
      expect(result).toEqual({
        message: 'Client deactivated successfully',
      });
    });
  });

  describe('activate', () => {
    it('should activate a client', async () => {
      const result = await controller.activate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'client',
        1,
        { isActive: true },
      );
      expect(result).toEqual({
        message: 'Client activated successfully',
      });
    });
  });

  describe('getPurchaseHistory', () => {
    it('should return client purchase history', async () => {
      const result = await controller.getPurchaseHistory(1);
      expect(clientsService.getPurchaseHistory).toHaveBeenCalledWith(1, {});
      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
        message: 'Purchase history retrieved successfully',
      });
    });

    it('should handle date filters', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';
      const result = await controller.getPurchaseHistory(1, dateFrom, dateTo);
      expect(clientsService.getPurchaseHistory).toHaveBeenCalledWith(1, {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });
      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
        message: 'Purchase history retrieved successfully',
      });
    });
  });

  describe('getPurchaseReport', () => {
    it('should return client purchase report', async () => {
      const result = await controller.getPurchaseReport(1);
      expect(clientsService.generatePurchaseReport).toHaveBeenCalledWith(
        1,
        'all',
      );
      expect(result).toEqual({
        data: { totalPurchases: 0, totalAmount: 0 },
        message: 'Purchase report generated successfully',
      });
    });

    it('should handle period filter', async () => {
      const result = await controller.getPurchaseReport(1, 'month');
      expect(clientsService.generatePurchaseReport).toHaveBeenCalledWith(
        1,
        'month',
      );
      expect(result).toEqual({
        data: { totalPurchases: 0, totalAmount: 0 },
        message: 'Purchase report generated successfully',
      });
    });
  });
});
