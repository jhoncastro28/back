import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateInventoryMovementDto,
  FilterInventoryMovementDto,
  UpdateInventoryMovementDto,
} from './dto';
import {
  MovementReason,
  MovementStatus,
  MovementType,
} from './dto/inventory-movement.types';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsController', () => {
  let controller: InventoryMovementsController;
  let service: InventoryMovementsService;

  const mockMovement = {
    id: 1,
    type: MovementType.ENTRY,
    reason: MovementReason.PURCHASE,
    status: MovementStatus.APPROVED,
    quantity: new Decimal(100),
    unitPrice: new Decimal(10.5),
    totalPrice: new Decimal(1050),
    movementDate: new Date('2024-03-20'),
    notes: 'Initial stock purchase',
    reference: 'PO-123',
    productId: 1,
    supplierId: 1,
    saleId: null,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 1,
      name: 'Test Product',
      description: 'A test product',
      currentStock: 100,
      minQuantity: 10,
      maxQuantity: 1000,
      supplierId: 1,
      isActive: true,
    },
    supplier: {
      id: 1,
      name: 'Test Supplier',
      email: 'supplier@test.com',
    },
    sale: null,
    user: {
      id: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  const mockPaginatedResponse = {
    data: [mockMovement],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Inventory movements retrieved successfully',
  };

  const mockStockAlert = {
    id: 1,
    name: 'Test Product',
    description: 'A test product',
    currentStock: 5,
    minQuantity: 10,
    maxQuantity: 1000,
    alertType: 'LOW_STOCK',
    supplier: {
      id: 1,
      name: 'Test Supplier',
      email: 'supplier@test.com',
    },
  };

  const mockStockReport = {
    summary: {
      totalMovements: 1,
      totalEntries: 1,
      totalExits: 0,
      totalPurchases: 1,
      totalSales: 0,
      totalReturns: 0,
      totalDamages: 0,
      totalAdjustments: 0,
    },
    movements: [mockMovement],
    message: 'Stock transactions report generated successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryMovementsController],
      providers: [
        {
          provide: InventoryMovementsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockMovement),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
            findOne: jest.fn().mockResolvedValue(mockMovement),
            update: jest.fn().mockResolvedValue(mockMovement),
            getStockAlerts: jest.fn().mockResolvedValue({
              data: [mockStockAlert],
              message: 'Stock alerts retrieved successfully',
            }),
            getProductMovementsHistory: jest
              .fn()
              .mockResolvedValue(mockPaginatedResponse),
            generateStockTransactionsReport: jest
              .fn()
              .mockResolvedValue(mockStockReport),
          },
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
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new inventory movement', async () => {
      const createDto: CreateInventoryMovementDto = {
        type: MovementType.ENTRY,
        reason: MovementReason.PURCHASE,
        quantity: 100,
        unitPrice: 10.5,
        productId: 1,
        supplierId: 1,
        notes: 'Initial stock purchase',
        status: MovementStatus.PENDING,
      };

      const result = await controller.create(createDto, 'user123');
      expect(service.create).toHaveBeenCalledWith(createDto, 'user123');
      expect(result).toEqual(mockMovement);
    });
  });

  describe('findAll', () => {
    it('should return paginated inventory movements', async () => {
      const filterDto: FilterInventoryMovementDto = {
        page: 1,
        limit: 10,
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle search filters', async () => {
      const filterDto: FilterInventoryMovementDto = {
        type: MovementType.ENTRY,
        reason: MovementReason.PURCHASE,
        productId: 1,
        supplierId: 1,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getStockAlerts', () => {
    it('should return stock alerts', async () => {
      const result = await controller.getStockAlerts();
      expect(service.getStockAlerts).toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockStockAlert],
        message: 'Stock alerts retrieved successfully',
      });
    });
  });

  describe('getProductMovementsHistory', () => {
    it('should return product movement history', async () => {
      const filters: FilterInventoryMovementDto = {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };

      const result = await controller.getProductMovementsHistory(1, filters);
      expect(service.getProductMovementsHistory).toHaveBeenCalledWith(
        1,
        filters,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('generateStockTransactionsReport', () => {
    it('should generate stock transactions report', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      const result = await controller.generateStockTransactionsReport(
        dateFrom,
        dateTo,
      );
      expect(service.generateStockTransactionsReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockStockReport);
    });
  });

  describe('findOne', () => {
    it('should return a movement by id', async () => {
      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMovement);
    });
  });

  describe('update', () => {
    it('should update a movement', async () => {
      const updateDto: UpdateInventoryMovementDto = {
        notes: 'Updated notes',
        status: MovementStatus.APPROVED,
      };

      const result = await controller.update(1, updateDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockMovement);
    });
  });
});
