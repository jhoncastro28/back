/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockAdjustmentType } from './dto/adjust-stock.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;
  let paginationService: PaginationService;

  const mockPriceDb = {
    id: 1,
    productId: 1,
    purchasePrice: new Decimal(350.5),
    sellingPrice: new Decimal(500),
    isCurrentPrice: true,
    validFrom: new Date('2025-05-25T23:07:40.142Z'),
    validTo: null,
    createdAt: new Date('2025-05-25T23:07:40.142Z'),
    updatedAt: new Date('2025-05-25T23:07:40.142Z'),
  };

  const mockSupplier = {
    id: 1,
    name: 'Samsung',
    email: 'contact@samsung.com',
  };

  const mockPriceResponse = {
    id: 1,
    productId: 1,
    purchasePrice: '350.5',
    sellingPrice: '500',
    isCurrentPrice: true,
    validFrom: new Date('2025-05-25T23:07:40.142Z'),
    validTo: null,
    createdAt: new Date('2025-05-25T23:07:40.142Z'),
    updatedAt: new Date('2025-05-25T23:07:40.142Z'),
  };

  const mockProductResponse = {
    id: 1,
    name: 'Samsung Galaxy S21',
    description: 'Latest Samsung flagship phone',
    minQuantity: 10,
    maxQuantity: 100,
    currentStock: 50,
    isActive: true,
    supplierId: 1,
    createdAt: new Date('2025-05-25T23:07:40.142Z'),
    updatedAt: new Date('2025-05-25T23:07:40.142Z'),
    supplier: {
      id: 1,
      name: 'Samsung',
      email: 'contact@samsung.com',
    },
    prices: [
      {
        id: 1,
        purchasePrice: 350.5,
        sellingPrice: 500,
        isCurrentPrice: true,
      },
    ],
  };

  const mockProductDb = {
    id: 1,
    name: 'Samsung Galaxy S21',
    description: 'Latest Samsung flagship phone',
    minQuantity: 10,
    maxQuantity: 100,
    currentStock: 50,
    isActive: true,
    supplierId: 1,
    createdAt: new Date('2025-05-25T23:07:40.142Z'),
    updatedAt: new Date('2025-05-25T23:07:40.142Z'),
    supplier: {
      id: 1,
      name: 'Samsung',
      email: 'contact@samsung.com',
    },
    prices: [
      {
        id: 1,
        purchasePrice: new Decimal('350.5'),
        sellingPrice: new Decimal('500'),
        isCurrentPrice: true,
        productId: 1,
        validFrom: new Date('2025-05-25T23:07:40.142Z'),
        validTo: null,
        createdAt: new Date('2025-05-25T23:07:40.142Z'),
        updatedAt: new Date('2025-05-25T23:07:40.142Z'),
      },
    ],
  };

  const mockPriceHistory = [
    mockPriceDb,
    {
      id: 2,
      productId: 1,
      purchasePrice: new Decimal(300),
      sellingPrice: new Decimal(450),
      isCurrentPrice: false,
      validFrom: new Date('2024-01-01'),
      validTo: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockResponse = {
    data: [mockProductResponse],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Products retrieved successfully',
    success: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        PaginationService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn().mockResolvedValue(mockProductDb),
              findMany: jest.fn().mockResolvedValue([mockProductDb]),
              findUnique: jest.fn().mockResolvedValue(mockProductDb),
              update: jest.fn().mockResolvedValue(mockProductDb),
              count: jest.fn().mockResolvedValue(1),
              fields: {
                minQuantity: 10,
              },
            },
            supplier: {
              findUnique: jest.fn().mockResolvedValue({ id: 1 }),
            },
            price: {
              create: jest.fn().mockResolvedValue(mockProductDb.prices[0]),
              findMany: jest.fn().mockResolvedValue([mockProductDb.prices[0]]),
            },
            saleDetail: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            $transaction: jest.fn((callback) =>
              callback({
                product: {
                  create: jest.fn().mockResolvedValue(mockProductDb),
                  update: jest.fn().mockResolvedValue(mockProductDb),
                  findUnique: jest.fn().mockResolvedValue(mockProductDb),
                },
                price: {
                  create: jest.fn().mockResolvedValue(mockProductDb.prices[0]),
                },
                inventoryMovement: {
                  create: jest.fn().mockResolvedValue({
                    id: 1,
                    type: 'ENTRY',
                    quantity: 10,
                  }),
                },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createDto = {
        name: 'Samsung Galaxy S21',
        description: 'Latest Samsung flagship phone',
        minQuantity: 10,
        maxQuantity: 100,
        supplierId: 1,
        purchasePrice: 350.5,
        sellingPrice: 500,
      };

      const result = await service.create(createDto);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const result = await service.findAll();
      expect(prismaService.product.findMany).toHaveBeenCalled();
      expect(prismaService.product.count).toHaveBeenCalled();
      expect(result.data).toEqual([mockProductResponse]);
      expect(result.meta).toBeDefined();
      expect(result.message).toBe('Products retrieved successfully');
    });

    it('should handle search filters', async () => {
      const filters = {
        name: 'Samsung',
        isActive: true,
        supplierId: 1,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(filters);
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: { contains: 'Samsung', mode: 'insensitive' },
            isActive: true,
            supplierId: 1,
          },
        }),
      );
      expect(result.data).toEqual([mockProductResponse]);
      expect(result.meta).toBeDefined();
      expect(result.message).toBe('Products retrieved successfully');
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne(1);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          supplier: true,
          prices: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = {
        name: 'Updated Samsung Galaxy S21',
      };

      const result = await service.update(1, updateDto);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockProductResponse);
    });
  });

  describe('adjustStock', () => {
    it('should increase product stock', async () => {
      const adjustStockDto = {
        quantity: 10,
        type: StockAdjustmentType.INCREASE,
        reason: 'Restocking',
      };

      const result = await service.adjustStock(1, adjustStockDto);
      expect(result).toEqual({
        data: mockProductDb,
        message: 'Stock successfully increased by 10 units',
      });
    });

    it('should decrease product stock', async () => {
      const adjustStockDto = {
        quantity: 10,
        type: StockAdjustmentType.DECREASE,
        reason: 'Damaged items',
      };

      const result = await service.adjustStock(1, adjustStockDto);
      expect(result).toEqual({
        data: mockProductDb,
        message: 'Stock successfully decreased by 10 units',
      });
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      const lowStockProduct = {
        ...mockProductDb,
        currentStock: 5,
      };

      prismaService.product.findMany = jest
        .fn()
        .mockResolvedValue([lowStockProduct]);

      const result = await service.getLowStockProducts();
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          currentStock: {
            lt: prismaService.product.fields.minQuantity,
          },
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              phoneNumber: true,
            },
          },
          prices: {
            where: {
              isCurrentPrice: true,
            },
            take: 1,
          },
        },
        orderBy: {
          currentStock: 'asc',
        },
      });
      expect(result).toEqual({
        data: [lowStockProduct],
        message: 'Low stock products retrieved successfully',
      });
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for a product', async () => {
      const result = await service.getPriceHistory(1);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
        },
      });
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Price history retrieved successfully');
    });
  });

  describe('generateStockStatusReport', () => {
    it('should generate stock status report', async () => {
      const result = await service.generateStockStatusReport();
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              contactName: true,
            },
          },
          prices: {
            where: {
              isCurrentPrice: true,
            },
            take: 1,
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Stock status report generated successfully');
    });
  });

  describe('generateSalesPerformanceReport', () => {
    it('should generate sales performance report', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');

      const mockSaleDetails = [
        {
          id: 1,
          saleId: 1,
          productId: 1,
          quantity: 5,
          unitPrice: new Decimal('500'),
          subtotal: new Decimal('2500'),
          product: mockProductDb,
          sale: {
            id: 1,
            saleDate: new Date('2025-05-25'),
            totalAmount: new Decimal('2500'),
          },
        },
      ];

      prismaService.saleDetail.findMany = jest
        .fn()
        .mockResolvedValue(mockSaleDetails);

      const result = await service.generateSalesPerformanceReport(
        dateFrom,
        dateTo,
      );
      expect(prismaService.saleDetail.findMany).toHaveBeenCalledWith({
        where: {
          sale: {
            saleDate: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        },
        include: {
          product: true,
          sale: {
            select: {
              id: true,
              saleDate: true,
              totalAmount: true,
            },
          },
        },
      });
      expect(result).toEqual({
        data: {
          summary: {
            period: {
              from: dateFrom,
              to: dateTo,
            },
            totalRevenue: 2500,
            totalQuantitySold: 5,
            totalProductsSold: 1,
          },
          topProductsByQuantity: [
            {
              productId: 1,
              name: mockProductDb.name,
              totalQuantity: 5,
              totalRevenue: 2500,
              averagePrice: 500,
              salesCount: 1,
            },
          ],
          topProductsByRevenue: [
            {
              productId: 1,
              name: mockProductDb.name,
              totalQuantity: 5,
              totalRevenue: 2500,
              averagePrice: 500,
              salesCount: 1,
            },
          ],
        },
        message: 'Sales performance report generated successfully',
      });
    });
  });

  describe('generatePriceChangesReport', () => {
    it('should generate price changes report', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');

      const mockPriceChanges = [
        {
          id: 1,
          productId: 1,
          purchasePrice: new Decimal('350.5'),
          sellingPrice: new Decimal('500'),
          isCurrentPrice: true,
          validFrom: new Date('2025-05-25'),
          validTo: null,
          createdAt: new Date('2025-05-25'),
          updatedAt: new Date('2025-05-25'),
          product: {
            id: 1,
            name: 'Samsung Galaxy S21',
          },
        },
      ];

      prismaService.price.findMany = jest
        .fn()
        .mockResolvedValue(mockPriceChanges);

      const result = await service.generatePriceChangesReport(dateFrom, dateTo);
      expect(prismaService.price.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual({
        data: {
          summary: {
            period: {
              from: dateFrom,
              to: dateTo,
            },
            totalPriceChanges: 1,
            productsWithPriceChanges: 1,
            avgPurchasePriceChangePercent: 0,
            avgSellingPriceChangePercent: 0,
          },
          productsWithPriceChanges: [
            {
              productId: 1,
              name: 'Samsung Galaxy S21',
              priceChanges: [
                {
                  id: 1,
                  date: mockPriceChanges[0].createdAt,
                  purchasePrice: 350.5,
                  sellingPrice: 500,
                },
              ],
              initialPurchasePrice: 350.5,
              latestPurchasePrice: 350.5,
              initialSellingPrice: 500,
              latestSellingPrice: 500,
              purchasePriceChangePercent: 0,
              sellingPriceChangePercent: 0,
            },
          ],
        },
        message: 'Price changes report generated successfully',
      });
    });
  });
});
