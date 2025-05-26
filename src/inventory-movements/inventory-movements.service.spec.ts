import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { FilterInventoryMovementDto } from './dto/filter-inventory-movement.dto';
import { MovementReason, MovementType } from './dto/inventory-movement.types';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;
  let prismaService: PrismaService;

  const mockInventoryMovementResponse = {
    id: 1,
    type: 'ENTRY',
    quantity: 10,
    reason: MovementReason.PURCHASE,
    notes: 'Initial stock',
    productId: 1,
    supplierId: 1,
    userId: 1,
    createdAt: new Date('2025-05-25T23:07:40.142Z'),
    updatedAt: new Date('2025-05-25T23:07:40.142Z'),
    product: {
      id: 1,
      name: 'Samsung Galaxy S21',
      currentStock: 50,
    },
    supplier: {
      id: 1,
      name: 'Samsung',
      email: 'contact@samsung.com',
    },
    user: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        PaginationService,
        {
          provide: PrismaService,
          useValue: {
            inventoryMovement: {
              create: jest
                .fn()
                .mockResolvedValue(mockInventoryMovementResponse),
              findMany: jest
                .fn()
                .mockResolvedValue([mockInventoryMovementResponse]),
              findUnique: jest
                .fn()
                .mockResolvedValue(mockInventoryMovementResponse),
              update: jest
                .fn()
                .mockResolvedValue(mockInventoryMovementResponse),
              count: jest.fn().mockResolvedValue(1),
            },
            product: {
              findUnique: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Samsung Galaxy S21',
                currentStock: 50,
              }),
              update: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Samsung Galaxy S21',
                currentStock: 60,
              }),
            },
            supplier: {
              findUnique: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Samsung',
                email: 'contact@samsung.com',
              }),
            },
            $transaction: jest.fn((_callback) =>
              Promise.resolve(mockInventoryMovementResponse),
            ),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            updateStock: jest.fn().mockResolvedValue({
              id: 1,
              name: 'Samsung Galaxy S21',
              currentStock: 60,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryMovementsService>(InventoryMovementsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new inventory movement', async () => {
      const createDto = {
        type: MovementType.ENTRY,
        reason: MovementReason.PURCHASE,
        quantity: 10,
        productId: 1,
        supplierId: 1,
      };

      const mockProduct = {
        id: 1,
        name: 'Samsung Galaxy S21',
        currentStock: 50,
      };

      const mockSupplier = {
        id: 1,
        name: 'Samsung',
        email: 'contact@samsung.com',
      };

      prismaService.product.findUnique = jest
        .fn()
        .mockResolvedValue(mockProduct);
      prismaService.supplier.findUnique = jest
        .fn()
        .mockResolvedValue(mockSupplier);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      prismaService.$transaction = jest.fn().mockImplementation((callback) => {
        return Promise.resolve(mockInventoryMovementResponse);
      });

      const result = await service.create(createDto, 'user123');

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.productId },
      });

      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.supplierId },
      });

      expect(result).toEqual({
        data: mockInventoryMovementResponse,
        message: 'Inventory movement created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated inventory movements', async () => {
      const filterDto: FilterInventoryMovementDto = {
        page: 1,
        limit: 10,
      };

      const paginatedResponse = {
        data: [mockInventoryMovementResponse],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'Inventory movements retrieved successfully',
        success: true,
      };

      const result = await service.findAll(filterDto);
      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalled();
      expect(prismaService.inventoryMovement.count).toHaveBeenCalled();
      expect(result).toEqual(paginatedResponse);
    });

    it('should handle search filters', async () => {
      const filterDto: FilterInventoryMovementDto = {
        type: MovementType.ENTRY,
        reason: MovementReason.PURCHASE,
        productId: 1,
      };

      const paginatedResponse = {
        data: [mockInventoryMovementResponse],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'Inventory movements retrieved successfully',
        success: true,
      };

      const result = await service.findAll(filterDto);
      expect(prismaService.inventoryMovement.findMany).toHaveBeenCalledWith({
        where: {
          type: filterDto.type,
          reason: {
            contains: filterDto.reason,
            mode: 'insensitive',
          },
          productId: filterDto.productId,
        },
        skip: 0,
        take: 10,
        orderBy: {
          movementDate: 'desc',
        },
        include: {
          product: true,
          supplier: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sale: true,
        },
      });
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return an inventory movement by id', async () => {
      const result = await service.findOne(1);
      expect(prismaService.inventoryMovement.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          product: true,
          supplier: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sale: true,
        },
      });
      expect(result).toEqual({
        data: mockInventoryMovementResponse,
        message: 'Inventory movement found successfully',
      });
    });
  });

  describe('update', () => {
    it('should update an inventory movement', async () => {
      const updateDto = {
        reason: MovementReason.ADJUSTMENT,
        notes: 'Updated notes',
      };

      const existingMovement = {
        id: 1,
        type: MovementType.ENTRY,
        quantity: 10,
        reason: MovementReason.PURCHASE,
        productId: 1,
      };

      prismaService.inventoryMovement.findUnique = jest
        .fn()
        .mockResolvedValue(existingMovement);

      prismaService.inventoryMovement.update = jest.fn().mockResolvedValue({
        ...existingMovement,
        ...updateDto,
        product: {
          id: 1,
          name: 'Samsung Galaxy S21',
          currentStock: 50,
        },
        supplier: {
          id: 1,
          name: 'Samsung',
          email: 'contact@samsung.com',
        },
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      });

      const result = await service.update(1, updateDto);

      expect(prismaService.inventoryMovement.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prismaService.inventoryMovement.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
        include: {
          product: true,
          supplier: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sale: true,
        },
      });

      expect(result).toEqual({
        data: expect.objectContaining({
          id: 1,
          type: MovementType.ENTRY,
          quantity: 10,
          reason: MovementReason.ADJUSTMENT,
          notes: 'Updated notes',
        }),
        message: 'Inventory movement updated successfully',
      });
    });

    it('should throw BadRequestException when trying to update critical fields', async () => {
      const updateDto = {
        type: MovementType.EXIT,
        quantity: 20,
        productId: 2,
      };

      const existingMovement = {
        id: 1,
        type: MovementType.ENTRY,
        quantity: 10,
        reason: MovementReason.PURCHASE,
        productId: 1,
      };

      prismaService.inventoryMovement.findUnique = jest
        .fn()
        .mockResolvedValue(existingMovement);

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Cannot update movement type, quantity, product, supplier, or sale. Create a new movement instead.',
      );
    });
  });
});
