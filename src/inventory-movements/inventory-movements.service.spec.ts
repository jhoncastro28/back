import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateInventoryMovementDto, MovementType } from './dto';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let productsService: ProductsService;

  // Mock data
  const userId = 'user-123';
  const movementId = 1;
  const productId = 1;
  const createEntryDto: CreateInventoryMovementDto = {
    type: MovementType.ENTRY,
    quantity: 10,
    productId: 1,
    supplierId: 1,
    reason: 'Initial stock',
  };
  const createExitDto: CreateInventoryMovementDto = {
    type: MovementType.EXIT,
    quantity: 5,
    productId: 1,
    reason: 'Manual adjustment',
  };
  const mockProduct = {
    id: productId,
    name: 'Test Product',
    description: 'Test Description',
    currentStock: 20,
    minQuantity: 10,
    maxQuantity: 50,
    isActive: true,
    supplierId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSupplier = {
    id: 1,
    name: 'Test Supplier',
    contactName: 'John Doe',
    email: 'supplier@example.com',
    phoneNumber: '1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSale = {
    id: 1,
    saleDate: new Date(),
    totalAmount: 100,
    clientId: 1,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockMovement = {
    id: movementId,
    type: MovementType.ENTRY,
    quantity: 10,
    productId,
    supplierId: 1,
    userId,
    movementDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
    supplier: mockSupplier,
    user: {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    sale: null,
  };

  // Mock the Prisma service
  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return await callback(mockPrismaService);
    }),
    inventoryMovement: {
      create: jest.fn().mockResolvedValue(mockMovement),
      findMany: jest.fn().mockResolvedValue([mockMovement]),
      findUnique: jest.fn().mockResolvedValue(mockMovement),
      update: jest.fn().mockResolvedValue({
        ...mockMovement,
        reason: 'Updated reason',
        notes: 'Updated notes',
      }),
      count: jest.fn().mockResolvedValue(1),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(mockProduct),
      findMany: jest.fn().mockImplementation((params) => {
        if (params.where.currentStock && params.where.currentStock.lt) {
          return [mockProduct];
        }
        if (
          params.where.maxQuantity &&
          params.where.currentStock &&
          params.where.currentStock.gt
        ) {
          return [mockProduct];
        }
        return [];
      }),
      fields: {
        minQuantity: 'minQuantity',
      },
      count: jest.fn().mockResolvedValue(1),
    },
    supplier: {
      findUnique: jest.fn().mockResolvedValue(mockSupplier),
    },
    sale: {
      findUnique: jest.fn().mockResolvedValue(mockSale),
    },
  };

  // Mock the ProductsService
  const mockProductsService = {
    updateStock: jest.fn().mockResolvedValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<InventoryMovementsService>(InventoryMovementsService);
    prismaService = module.get<PrismaService>(PrismaService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an inventory entry movement', async () => {
      const result = await service.create(createEntryDto, userId);

      // Validate that stock is increased for ENTRY
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(
        productId,
        createEntryDto.quantity,
      );

      expect(result.data).toEqual(mockMovement);
      expect(result.message).toBe('Inventory movement created successfully');
    });

    it('should create an inventory exit movement', async () => {
      mockPrismaService.inventoryMovement.create.mockResolvedValueOnce({
        ...mockMovement,
        type: MovementType.EXIT,
        quantity: createExitDto.quantity,
      });

      const result = await service.create(createExitDto, userId);

      // Validate that stock is decreased for EXIT
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(
        productId,
        -createExitDto.quantity,
      );

      expect(result.data.type).toEqual(MovementType.EXIT);
      expect(result.data.quantity).toEqual(createExitDto.quantity);
    });

    it('should throw an error if supplier is not provided for entry', async () => {
      const invalidDto = {
        ...createEntryDto,
        supplierId: undefined,
      };

      await expect(service.create(invalidDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an error if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(createEntryDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of inventory movements', async () => {
      const result = await service.findAll({});

      expect(result.data).toEqual([mockMovement]);
      expect(result.meta.total).toEqual(1);
      expect(result.meta.page).toEqual(1);
    });

    it('should apply filters correctly', async () => {
      await service.findAll({
        type: MovementType.ENTRY,
        productId: 1,
        supplierId: 1,
      });

      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: MovementType.ENTRY,
            productId: 1,
            supplierId: 1,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single inventory movement', async () => {
      const result = await service.findOne(movementId);

      expect(prismaService.inventoryMovement.findUnique).toHaveBeenCalledWith({
        where: { id: movementId },
        include: expect.any(Object),
      });
      expect(result.data).toEqual(mockMovement);
    });

    it('should throw an error if movement is not found', async () => {
      mockPrismaService.inventoryMovement.findUnique.mockResolvedValueOnce(
        null,
      );

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an inventory movement', async () => {
      const updateDto = {
        reason: 'Updated reason',
        notes: 'Updated notes',
      };

      const result = await service.update(movementId, updateDto);

      expect(prismaService.inventoryMovement.update).toHaveBeenCalledWith({
        where: { id: movementId },
        data: updateDto,
        include: expect.any(Object),
      });
      expect(result.data.reason).toEqual(updateDto.reason);
      expect(result.data.notes).toEqual(updateDto.notes);
    });

    it('should throw an error if trying to update critical fields', async () => {
      const invalidUpdateDto = {
        type: MovementType.EXIT,
        quantity: 20,
      };

      await expect(
        service.update(movementId, invalidUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProductMovementsHistory', () => {
    it('should return movement history for a specific product', async () => {
      const result = await service.getProductMovementsHistory(productId);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(result.data).toEqual([mockMovement]);
    });

    it('should throw an error if product is not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.getProductMovementsHistory(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStockAlerts', () => {
    it('should return products with stock alerts (low and high)', async () => {
      const mockLowStockProduct = {
        ...mockProduct,
        currentStock: 5,
        minQuantity: 10,
      };

      const mockHighStockProduct = {
        ...mockProduct,
        id: 2,
        name: 'High Stock Product',
        currentStock: 100,
        maxQuantity: 80,
      };

      // Reset the product.findMany mock
      mockPrismaService.product.findMany = jest.fn();

      // First call - for low stock products
      mockPrismaService.product.findMany.mockResolvedValueOnce([
        mockLowStockProduct,
      ]);

      // Second call - for high stock products
      mockPrismaService.product.findMany.mockResolvedValueOnce([
        mockHighStockProduct,
      ]);

      const result = await service.getStockAlerts();

      expect(result.data.lowStock).toEqual([mockLowStockProduct]);
      expect(result.data.highStock).toEqual([mockHighStockProduct]);
      expect(result.message).toBe('Stock alerts retrieved successfully');

      // Verify the correct queries were made
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            currentStock: {
              lt: prismaService.product.fields.minQuantity,
            },
          }),
        }),
      );

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            maxQuantity: { not: null },
            currentStock: {
              gt: prismaService.product.fields.maxQuantity,
            },
          }),
        }),
      );
    });
  });

  describe('generateStockTransactionsReport', () => {
    it('should generate a report of stock transactions', async () => {
      const dateFrom = new Date('2023-01-01');
      const dateTo = new Date('2023-12-31');

      mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([
        {
          ...mockMovement,
          type: MovementType.ENTRY,
          quantity: 10,
        },
        {
          ...mockMovement,
          id: 2,
          type: MovementType.EXIT,
          quantity: 5,
        },
      ]);

      const result = await service.generateStockTransactionsReport(
        dateFrom,
        dateTo,
      );

      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            movementDate: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
      );

      expect(result.data.summary.totalMovements).toEqual(2);
      expect(result.data.summary.entriesCount).toEqual(1);
      expect(result.data.summary.exitsCount).toEqual(1);
      expect(result.data.summary.totalItemsReceived).toEqual(10);
      expect(result.data.summary.totalItemsRemoved).toEqual(5);
      expect(result.message).toBe(
        'Stock transactions report generated successfully',
      );
    });

    it('should throw an error if start date is after end date', async () => {
      const dateFrom = new Date('2023-12-31');
      const dateTo = new Date('2023-01-01');

      await expect(
        service.generateStockTransactionsReport(dateFrom, dateTo),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException as deletion is not allowed', async () => {
      await expect(service.remove(movementId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
