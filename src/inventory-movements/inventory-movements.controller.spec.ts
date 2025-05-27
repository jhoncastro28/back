import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  CreateInventoryMovementDto,
  MovementType,
  UpdateInventoryMovementDto,
} from './dto';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsController', () => {
  let controller: InventoryMovementsController;
  let service: InventoryMovementsService;

  // Mock data
  const userId = 'user-123';
  const movementId = 1;
  const productId = 1;
  const createDto: CreateInventoryMovementDto = {
    type: MovementType.ENTRY,
    quantity: 10,
    productId: 1,
    supplierId: 1,
    reason: 'Initial stock',
  };
  const updateDto: UpdateInventoryMovementDto = {
    reason: 'Updated reason',
    notes: 'Updated notes',
  };
  const mockMovement = {
    id: movementId,
    type: MovementType.ENTRY,
    quantity: 10,
    productId: 1,
    supplierId: 1,
    reason: 'Initial stock',
    movementDate: new Date(),
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockMovementResponse = {
    data: mockMovement,
    message: 'Inventory movement created successfully',
  };
  const mockPaginatedResponse = {
    data: [mockMovement],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    message: 'Inventory movements retrieved successfully',
  };
  const mockStockAlerts = {
    data: {
      lowStock: [
        {
          id: 1,
          name: 'Product 1',
          currentStock: 5,
          minQuantity: 10,
        },
      ],
      highStock: [
        {
          id: 2,
          name: 'Product 2',
          currentStock: 100,
          maxQuantity: 80,
        },
      ],
    },
    message: 'Stock alerts retrieved successfully',
  };
  const mockTransactionsReport = {
    data: {
      summary: {
        totalMovements: 1,
        entriesCount: 1,
        exitsCount: 0,
        totalItemsReceived: 10,
        totalItemsRemoved: 0,
        periodStart: new Date('2023-01-01'),
        periodEnd: new Date('2023-12-31'),
      },
      topProducts: [],
      movements: [mockMovement],
    },
    message: 'Stock transactions report generated successfully',
  };

  // Create a mock service object
  const mockInventoryMovementsService = {
    create: jest.fn().mockResolvedValue(mockMovementResponse),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockMovementResponse),
    update: jest.fn().mockResolvedValue(mockMovementResponse),
    getProductMovementsHistory: jest
      .fn()
      .mockResolvedValue(mockPaginatedResponse),
    getStockAlerts: jest.fn().mockResolvedValue(mockStockAlerts),
    generateStockTransactionsReport: jest
      .fn()
      .mockResolvedValue(mockTransactionsReport),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryMovementsController],
      providers: [
        {
          provide: InventoryMovementsService,
          useValue: mockInventoryMovementsService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ProductsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<InventoryMovementsController>(
      InventoryMovementsController,
    );
    service = module.get<InventoryMovementsService>(InventoryMovementsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new inventory movement', async () => {
      const result = await controller.create(createDto, userId);

      expect(service.create).toHaveBeenCalledWith(createDto, userId);
      expect(result).toEqual(mockMovementResponse);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of inventory movements', async () => {
      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single inventory movement', async () => {
      const result = await controller.findOne(movementId);

      expect(service.findOne).toHaveBeenCalledWith(movementId);
      expect(result).toEqual(mockMovementResponse);
    });
  });

  describe('update', () => {
    it('should update an inventory movement', async () => {
      const result = await controller.update(movementId, updateDto);

      expect(service.update).toHaveBeenCalledWith(movementId, updateDto);
      expect(result).toEqual(mockMovementResponse);
    });
  });

  describe('getProductMovementsHistory', () => {
    it('should return movement history for a specific product', async () => {
      const filters = { limit: 5 };
      const result = await controller.getProductMovementsHistory(
        productId,
        filters,
      );

      expect(service.getProductMovementsHistory).toHaveBeenCalledWith(
        productId,
        filters,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getStockAlerts', () => {
    it('should return lists of products with stock alerts (low and high)', async () => {
      const result = await controller.getStockAlerts();

      expect(service.getStockAlerts).toHaveBeenCalled();
      expect(result).toEqual(mockStockAlerts);
      expect(result.data.lowStock).toBeDefined();
      expect(result.data.highStock).toBeDefined();
    });
  });

  describe('generateStockTransactionsReport', () => {
    it('should generate a report of stock transactions', async () => {
      const dateFrom = '2023-01-01';
      const dateTo = '2023-12-31';
      const result = await controller.generateStockTransactionsReport(
        dateFrom,
        dateTo,
      );

      expect(service.generateStockTransactionsReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockTransactionsReport);
    });
  });
});
