import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import {
  AdjustStockDto,
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from './dto';
import { StockAdjustmentType } from './dto/adjust-stock.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;
  let toggleActiveService: ToggleActiveService;

  const mockProduct = {
    id: 1,
    name: 'Samsung Galaxy S21',
    description: 'Smartphone with 6.2-inch screen, 128GB storage',
    currentStock: 50,
    minQuantity: 10,
    maxQuantity: 100,
    supplierId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: {
      id: 1,
      name: 'Samsung Electronics',
      email: 'contact@samsung.com',
    },
    prices: [
      {
        id: 1,
        purchasePrice: new Decimal(350.5),
        sellingPrice: new Decimal(500.0),
        isCurrentPrice: true,
        validFrom: new Date(),
        validTo: null,
        productId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockPaginatedResponse = {
    data: [mockProduct],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Products retrieved successfully',
  };

  const mockPriceHistory = {
    data: [
      {
        id: 1,
        purchasePrice: new Decimal(350.5),
        sellingPrice: new Decimal(500.0),
        isCurrentPrice: true,
        validFrom: new Date(),
        validTo: null,
        productId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        purchasePrice: new Decimal(300.0),
        sellingPrice: new Decimal(450.0),
        isCurrentPrice: false,
        validFrom: new Date('2024-01-01'),
        validTo: new Date(),
        productId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    message: 'Price history retrieved successfully',
  };

  const mockStockReport = {
    summary: {
      totalProducts: 1,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      overStockProducts: 0,
      averageStockLevel: 50,
    },
    products: [mockProduct],
    message: 'Stock status report generated successfully',
  };

  const mockSalesReport = {
    summary: {
      totalSales: 10,
      totalRevenue: new Decimal(5000.0),
      totalProfit: new Decimal(1495.0),
      averageOrderValue: new Decimal(500.0),
    },
    products: [
      {
        ...mockProduct,
        totalQuantitySold: 10,
        totalRevenue: new Decimal(5000.0),
        totalProfit: new Decimal(1495.0),
      },
    ],
    message: 'Sales performance report generated successfully',
  };

  const mockPriceChangesReport = {
    summary: {
      totalChanges: 1,
      averagePriceIncrease: new Decimal(50.0),
      averagePriceDecrease: new Decimal(0),
    },
    changes: [
      {
        productId: 1,
        productName: 'Samsung Galaxy S21',
        oldPurchasePrice: new Decimal(300.0),
        newPurchasePrice: new Decimal(350.5),
        oldSellingPrice: new Decimal(450.0),
        newSellingPrice: new Decimal(500.0),
        changeDate: new Date(),
      },
    ],
    message: 'Price changes report generated successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockProduct),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
            findOne: jest.fn().mockResolvedValue({
              message: 'Product found',
              product: mockProduct,
            }),
            update: jest.fn().mockResolvedValue(mockProduct),
            getLowStockProducts: jest.fn().mockResolvedValue({
              data: [mockProduct],
              message: 'Low stock products retrieved successfully',
            }),
            getPriceHistory: jest.fn().mockResolvedValue(mockPriceHistory),
            adjustStock: jest.fn().mockResolvedValue(mockProduct),
            generateStockStatusReport: jest
              .fn()
              .mockResolvedValue(mockStockReport),
            generateSalesPerformanceReport: jest
              .fn()
              .mockResolvedValue(mockSalesReport),
            generatePriceChangesReport: jest
              .fn()
              .mockResolvedValue(mockPriceChangesReport),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest.fn().mockImplementation((type, id, data) => {
              if (data.isActive) {
                return Promise.resolve({
                  message: 'Product activated successfully',
                });
              }
              return Promise.resolve({
                message: 'Product deactivated successfully',
              });
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(toggleActiveService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createDto: CreateProductDto = {
        name: 'Samsung Galaxy S21',
        description: 'Smartphone with 6.2-inch screen, 128GB storage',
        minQuantity: 10,
        maxQuantity: 100,
        supplierId: 1,
        purchasePrice: 350.5,
        sellingPrice: 500.0,
      };

      const result = await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const filterDto: FilterProductDto = {
        page: 1,
        limit: 10,
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle search filters', async () => {
      const filterDto: FilterProductDto = {
        name: 'Samsung',
        isActive: true,
        supplierId: 1,
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      const result = await controller.getLowStockProducts();
      expect(service.getLowStockProducts).toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockProduct],
        message: 'Low stock products retrieved successfully',
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Product found',
        product: mockProduct,
      });
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for a product', async () => {
      const result = await controller.getPriceHistory(1);
      expect(service.getPriceHistory).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPriceHistory);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Samsung Galaxy S21 Ultra',
        description: 'Updated description',
        minQuantity: 15,
        maxQuantity: 150,
      };

      const result = await controller.update(1, updateDto);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('adjustStock', () => {
    it('should adjust product stock', async () => {
      const adjustStockDto: AdjustStockDto = {
        type: StockAdjustmentType.INCREASE,
        quantity: 10,
        reason: 'Manual adjustment',
      };

      const result = await controller.adjustStock(1, adjustStockDto);
      expect(service.adjustStock).toHaveBeenCalledWith(1, adjustStockDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a product', async () => {
      const result = await controller.deactivate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'product',
        1,
        { isActive: false },
      );
      expect(result).toEqual({
        message: 'Product deactivated successfully',
      });
    });
  });

  describe('activate', () => {
    it('should activate a product', async () => {
      const result = await controller.activate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'product',
        1,
        { isActive: true },
      );
      expect(result).toEqual({
        message: 'Product activated successfully',
      });
    });
  });

  describe('getStockStatusReport', () => {
    it('should generate stock status report', async () => {
      const result = await controller.getStockStatusReport();
      expect(service.generateStockStatusReport).toHaveBeenCalled();
      expect(result).toEqual(mockStockReport);
    });
  });

  describe('getSalesPerformanceReport', () => {
    it('should generate sales performance report', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      const result = await controller.getSalesPerformanceReport(
        dateFrom,
        dateTo,
      );
      expect(service.generateSalesPerformanceReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockSalesReport);
    });
  });

  describe('getPriceChangesReport', () => {
    it('should generate price changes report', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      const result = await controller.getPriceChangesReport(dateFrom, dateTo);
      expect(service.generatePriceChangesReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockPriceChangesReport);
    });
  });
});
