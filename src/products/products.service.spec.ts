import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  // Mock for Prisma service
  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
    },
    price: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    saleDetail: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) =>
      callback({
        product: {
          create: jest.fn(),
          update: jest.fn(),
        },
        price: {
          create: jest.fn(),
          findFirst: jest.fn(),
          update: jest.fn(),
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with its initial price', async () => {
      // Arrange
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        supplierId: 1,
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const mockSupplier = {
        id: 1,
        name: 'Test Supplier',
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
        description: null,
        minQuantity: 0,
        maxQuantity: null,
        currentStock: 0,
        isActive: true,
        supplierId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txClient = {
          product: {
            create: jest.fn().mockResolvedValue(mockProduct),
          },
          price: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              purchasePrice: createProductDto.purchasePrice,
              sellingPrice: createProductDto.sellingPrice,
              isCurrentPrice: true,
              productId: mockProduct.id,
            }),
          },
        };
        return callback(txClient);
      });

      // Act
      const result = await service.create(createProductDto);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: createProductDto.supplierId },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      // Arrange
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        supplierId: 999, // Non-existent ID
        purchasePrice: 100,
        sellingPrice: 150,
      };

      mockPrismaService.supplier.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: createProductDto.supplierId },
      });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      // Arrange
      const filterDto: FilterProductDto = {
        page: 1,
        limit: 10,
      };

      const mockProducts = [
        {
          id: 1,
          name: 'Test Product',
          supplierId: 1,
          currentStock: 10,
          isActive: true,
          supplier: { id: 1, name: 'Test Supplier' },
          prices: [
            {
              id: 1,
              purchasePrice: 100,
              sellingPrice: 150,
              isCurrentPrice: true,
            },
          ],
        },
      ];

      const mockTotal = 1;

      mockPrismaService.product.count.mockResolvedValue(mockTotal);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(result).toEqual({
        data: mockProducts,
        meta: {
          total: mockTotal,
          page: filterDto.page,
          limit: filterDto.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      expect(prismaService.product.count).toHaveBeenCalled();
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          supplier: true,
          prices: {
            where: { isCurrentPrice: true },
            take: 1,
          },
        },
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filterDto: FilterProductDto = {
        name: 'Test',
        isActive: true,
        supplierId: '1',
        page: 1,
        limit: 10,
      };

      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(filterDto);

      // Assert
      expect(prismaService.product.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Test',
            mode: 'insensitive',
          },
          isActive: true,
          supplierId: 1,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by its ID', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        supplierId: 1,
        supplier: { id: 1, name: 'Test Supplier' },
        prices: [
          {
            id: 1,
            purchasePrice: 100,
            sellingPrice: 150,
            isCurrentPrice: true,
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(productId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
        include: {
          supplier: true,
          prices: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const productId = 999; // Non-existent ID
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      // Arrange
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        supplierId: 1,
      };

      const mockUpdatedProduct = {
        ...mockProduct,
        name: updateProductDto.name,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txClient = {
          product: {
            update: jest.fn().mockResolvedValue(mockUpdatedProduct),
          },
        };
        return callback(txClient);
      });

      // Act
      const result = await service.update(productId, updateProductDto);

      // Assert
      expect(result).toEqual(mockUpdatedProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should update the price when new values are provided', async () => {
      // Arrange
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        purchasePrice: 120,
        sellingPrice: 180,
      };

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        supplierId: 1,
      };

      const mockCurrentPrice = {
        id: 1,
        purchasePrice: 100,
        sellingPrice: 150,
        isCurrentPrice: true,
        productId,
      };

      const mockUpdatedProduct = {
        ...mockProduct,
        name: updateProductDto.name,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txClient = {
          product: {
            update: jest.fn().mockResolvedValue(mockUpdatedProduct),
          },
          price: {
            findFirst: jest.fn().mockResolvedValue(mockCurrentPrice),
            update: jest.fn(),
            create: jest.fn(),
          },
        };
        return callback(txClient);
      });

      // Act
      const result = await service.update(productId, updateProductDto);

      // Assert
      expect(result).toEqual(mockUpdatedProduct);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const productId = 999; // Non-existent ID
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should mark a product as inactive', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        isActive: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      // Act
      await service.deactivate(productId);

      // Assert
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const productId = 999; // Non-existent ID
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deactivate(productId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.product.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStock', () => {
    it('should increase product stock', async () => {
      // Arrange
      const productId = 1;
      const quantity = 5;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        currentStock: 10,
      };

      const mockUpdatedProduct = {
        ...mockProduct,
        currentStock: mockProduct.currentStock + quantity,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(mockUpdatedProduct);

      // Act
      const result = await service.updateStock(productId, quantity);

      // Assert
      expect(result).toEqual(mockUpdatedProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: { currentStock: mockProduct.currentStock + quantity },
      });
    });

    it('should decrease product stock', async () => {
      // Arrange
      const productId = 1;
      const quantity = -5;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        currentStock: 10,
      };

      const mockUpdatedProduct = {
        ...mockProduct,
        currentStock: mockProduct.currentStock + quantity,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(mockUpdatedProduct);

      // Act
      const result = await service.updateStock(productId, quantity);

      // Assert
      expect(result).toEqual(mockUpdatedProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.product.update).toHaveBeenCalled();
    });

    it('should throw error when trying to decrease more than available stock', async () => {
      // Arrange
      const productId = 1;
      const quantity = -15; // More than available stock
      const mockProduct = {
        id: productId,
        name: 'Test Product',
        currentStock: 10,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(service.updateStock(productId, quantity)).rejects.toThrow(
        `Insufficient stock available for product ${mockProduct.name}`,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.product.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const productId = 999; // Non-existent ID
      const quantity = 5;

      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStock(productId, quantity)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.product.update).not.toHaveBeenCalled();
    });
  });

  describe('generateStockStatusReport', () => {
    it('should generate a comprehensive stock status report', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          name: 'Low Stock Product',
          currentStock: 5,
          minQuantity: 10,
          maxQuantity: 50,
          isActive: true,
          supplier: {
            id: 1,
            name: 'Test Supplier',
            contactName: 'John Doe',
            email: 'supplier@example.com',
            phoneNumber: '1234567890',
          },
          prices: [
            {
              purchasePrice: 100,
              sellingPrice: 150,
              isCurrentPrice: true,
            },
          ],
        },
        {
          id: 2,
          name: 'High Stock Product',
          currentStock: 60,
          minQuantity: 10,
          maxQuantity: 50,
          isActive: true,
          supplier: {
            id: 1,
            name: 'Test Supplier',
            contactName: 'John Doe',
            email: 'supplier@example.com',
            phoneNumber: '1234567890',
          },
          prices: [
            {
              purchasePrice: 200,
              sellingPrice: 250,
              isCurrentPrice: true,
            },
          ],
        },
        {
          id: 3,
          name: 'Optimal Stock Product',
          currentStock: 30,
          minQuantity: 10,
          maxQuantity: 50,
          isActive: true,
          supplier: {
            id: 1,
            name: 'Test Supplier',
            contactName: 'John Doe',
            email: 'supplier@example.com',
            phoneNumber: '1234567890',
          },
          prices: [
            {
              purchasePrice: 150,
              sellingPrice: 200,
              isCurrentPrice: true,
            },
          ],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      // Act
      const result = await service.generateStockStatusReport();

      // Assert
      expect(result.data.summary).toBeDefined();
      expect(result.data.stockCategories).toBeDefined();
      expect(result.data.stockCategories.lowStock).toHaveLength(1);
      expect(result.data.stockCategories.highStock).toHaveLength(1);
      expect(result.data.stockCategories.optimalStock).toHaveLength(1);
      expect(result.data.summary.totalProducts).toBe(3);
      expect(result.message).toBe('Stock status report generated successfully');
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          include: expect.any(Object),
        }),
      );
    });
  });

  describe('generateSalesPerformanceReport', () => {
    it('should generate a sales performance report with date range', async () => {
      // Arrange
      const dateFrom = new Date('2023-01-01');
      const dateTo = new Date('2023-12-31');

      const mockSaleDetails = [
        {
          quantity: 5,
          unitPrice: 150,
          product: {
            id: 1,
            name: 'Product 1',
          },
          sale: {
            id: 1,
            saleDate: new Date('2023-06-15'),
            totalAmount: 750,
          },
        },
        {
          quantity: 3,
          unitPrice: 200,
          product: {
            id: 2,
            name: 'Product 2',
          },
          sale: {
            id: 2,
            saleDate: new Date('2023-07-20'),
            totalAmount: 600,
          },
        },
      ];

      mockPrismaService.saleDetail.findMany.mockResolvedValue(mockSaleDetails);

      // Act
      const result = await service.generateSalesPerformanceReport(
        dateFrom,
        dateTo,
      );

      // Assert
      expect(result.data.summary).toBeDefined();
      expect(result.data.topProductsByQuantity).toBeDefined();
      expect(result.data.topProductsByRevenue).toBeDefined();
      expect(result.data.summary.totalRevenue).toBeGreaterThan(0);
      expect(result.data.summary.totalQuantitySold).toBeGreaterThan(0);
      expect(result.data.summary.period.from).toEqual(dateFrom);
      expect(result.data.summary.period.to).toEqual(dateTo);
      expect(result.message).toBe(
        'Sales performance report generated successfully',
      );
      expect(mockPrismaService.saleDetail.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sale: {
              saleDate: {
                gte: dateFrom,
                lte: dateTo,
              },
            },
          },
        }),
      );
    });

    it('should use default date range if not provided', async () => {
      // Arrange
      mockPrismaService.saleDetail.findMany.mockResolvedValue([]);

      // Act
      await service.generateSalesPerformanceReport();

      // Assert
      expect(mockPrismaService.saleDetail.findMany).toHaveBeenCalled();
      const callArg = mockPrismaService.saleDetail.findMany.mock.calls[0][0];
      expect(callArg.where.sale.saleDate.gte).toBeDefined();
      expect(callArg.where.sale.saleDate.lte).toBeDefined();
    });
  });

  describe('generatePriceChangesReport', () => {
    it('should generate a price changes report with date range', async () => {
      // Arrange
      const dateFrom = new Date('2023-01-01');
      const dateTo = new Date('2023-12-31');

      const mockPriceChanges = [
        {
          id: 1,
          purchasePrice: 100,
          sellingPrice: 150,
          createdAt: new Date('2023-03-01'),
          productId: 1,
          product: {
            id: 1,
            name: 'Product 1',
          },
        },
        {
          id: 2,
          purchasePrice: 120,
          sellingPrice: 180,
          createdAt: new Date('2023-06-01'),
          productId: 1,
          product: {
            id: 1,
            name: 'Product 1',
          },
        },
        {
          id: 3,
          purchasePrice: 200,
          sellingPrice: 250,
          createdAt: new Date('2023-04-15'),
          productId: 2,
          product: {
            id: 2,
            name: 'Product 2',
          },
        },
      ];

      mockPrismaService.price.findMany.mockResolvedValue(mockPriceChanges);

      // Act
      const result = await service.generatePriceChangesReport(dateFrom, dateTo);

      // Assert
      expect(result.data.summary).toBeDefined();
      expect(result.data.productsWithPriceChanges).toBeDefined();
      expect(result.data.summary.totalPriceChanges).toBe(
        mockPriceChanges.length,
      );
      expect(result.data.summary.period.from).toEqual(dateFrom);
      expect(result.data.summary.period.to).toEqual(dateTo);
      expect(result.message).toBe(
        'Price changes report generated successfully',
      );
      expect(mockPrismaService.price.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
      );
    });

    it('should use default date range if not provided', async () => {
      // Arrange
      mockPrismaService.price.findMany.mockResolvedValue([]);

      // Act
      await service.generatePriceChangesReport();

      // Assert
      expect(mockPrismaService.price.findMany).toHaveBeenCalled();
      const callArg = mockPrismaService.price.findMany.mock.calls[0][0];
      expect(callArg.where.createdAt.gte).toBeDefined();
      expect(callArg.where.createdAt.lte).toBeDefined();
    });
  });
});
