import { Test, TestingModule } from '@nestjs/testing';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from './dto';
import { StockAdjustmentType } from './dto/adjust-stock.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;
  let toggleActiveService: ToggleActiveService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    getLowStockProducts: jest.fn(),
    getPriceHistory: jest.fn(),
    adjustStock: jest.fn(),
    generateStockStatusReport: jest.fn(),
    generateSalesPerformanceReport: jest.fn(),
    generatePriceChangesReport: jest.fn(),
  };

  const mockToggleActiveService = {
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: ToggleActiveService,
          useValue: mockToggleActiveService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      // Arrange
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        supplierId: 1,
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const expectedResult = {
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

      mockProductsService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createProductDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      // Arrange
      const filterDto: FilterProductDto = {
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Test Product',
            supplierId: 1,
            currentStock: 10,
            isActive: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      mockProductsService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      // Arrange
      const productId = 1;

      const expectedResult = {
        id: productId,
        name: 'Test Product',
        supplierId: 1,
        currentStock: 10,
        isActive: true,
      };

      mockProductsService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(productId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(productId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      // Arrange
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        sellingPrice: 200,
      };

      const expectedResult = {
        id: productId,
        name: 'Updated Product',
        supplierId: 1,
        currentStock: 10,
        isActive: true,
      };

      mockProductsService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(productId, updateProductDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(productId, updateProductDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a product', async () => {
      // Arrange
      const productId = 1;
      const expectedResult = {
        message: 'product deactivated successfully',
        data: {
          id: productId,
          isActive: false,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.deactivate(productId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'product',
        productId,
        { isActive: false },
      );
      expect(toggleActiveService.toggleActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('activate', () => {
    it('should activate a product', async () => {
      // Arrange
      const productId = 1;
      const expectedResult = {
        message: 'product activated successfully',
        data: {
          id: productId,
          isActive: true,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.activate(productId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'product',
        productId,
        { isActive: true },
      );
      expect(toggleActiveService.toggleActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return a list of products with stock below minimum quantity', async () => {
      const mockResponse = {
        data: [],
        message: 'Low stock products retrieved successfully',
      };

      jest
        .spyOn(service, 'getLowStockProducts')
        .mockResolvedValue(mockResponse);

      const result = await controller.getLowStockProducts();

      expect(service.getLowStockProducts).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for a specific product', async () => {
      const productId = 1;
      const mockResponse = {
        data: {
          product: { id: productId, name: 'Test Product' },
          priceHistory: [],
        },
        message: 'Price history retrieved successfully',
      };

      jest.spyOn(service, 'getPriceHistory').mockResolvedValue(mockResponse);

      const result = await controller.getPriceHistory(productId);

      expect(service.getPriceHistory).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock for a product', async () => {
      const productId = 1;
      const adjustStockDto = {
        type: StockAdjustmentType.INCREASE,
        quantity: 5,
        reason: 'Test adjustment',
      };

      const mockProduct = {
        id: productId,
        name: 'Test Product',
        description: 'Test Description',
        minQuantity: 10,
        maxQuantity: 100,
        currentStock: 15,
        isActive: true,
        supplierId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: mockProduct,
        message: 'Stock successfully increased by 5 units',
      };

      jest.spyOn(service, 'adjustStock').mockResolvedValue(mockResponse);

      const result = await controller.adjustStock(productId, adjustStockDto);

      expect(service.adjustStock).toHaveBeenCalledWith(
        productId,
        adjustStockDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStockStatusReport', () => {
    it('should generate a stock status report', async () => {
      const mockReport = {
        data: {
          summary: {
            totalProducts: 10,
            totalStock: 500,
            averageStock: 50,
            totalStockValue: 25000,
            lowStockCount: 2,
            highStockCount: 1,
            optimalStockCount: 7,
          },
          stockCategories: {
            lowStock: [],
            highStock: [],
            optimalStock: [],
          },
        },
        message: 'Stock status report generated successfully',
      };

      jest
        .spyOn(service, 'generateStockStatusReport')
        .mockResolvedValue(mockReport);

      const result = await controller.getStockStatusReport();

      expect(service.generateStockStatusReport).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });
  });

  describe('getSalesPerformanceReport', () => {
    it('should generate a sales performance report', async () => {
      const mockReport = {
        data: {
          summary: {
            period: {
              from: new Date('2023-01-01'),
              to: new Date('2023-12-31'),
            },
            totalRevenue: 15000,
            totalQuantitySold: 300,
            totalProductsSold: 5,
          },
          topProductsByQuantity: [],
          topProductsByRevenue: [],
        },
        message: 'Sales performance report generated successfully',
      };

      const dateFrom = '2023-01-01';
      const dateTo = '2023-12-31';

      jest
        .spyOn(service, 'generateSalesPerformanceReport')
        .mockResolvedValue(mockReport);

      const result = await controller.getSalesPerformanceReport(
        dateFrom,
        dateTo,
      );

      expect(service.generateSalesPerformanceReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockReport);
    });
  });

  describe('getPriceChangesReport', () => {
    it('should generate a price changes report', async () => {
      const mockReport = {
        data: {
          summary: {
            period: {
              from: new Date('2023-01-01'),
              to: new Date('2023-12-31'),
            },
            totalPriceChanges: 15,
            productsWithPriceChanges: 8,
            avgPurchasePriceChangePercent: 5.2,
            avgSellingPriceChangePercent: 7.5,
          },
          productsWithPriceChanges: [],
        },
        message: 'Price changes report generated successfully',
      };

      const dateFrom = '2023-01-01';
      const dateTo = '2023-12-31';

      jest
        .spyOn(service, 'generatePriceChangesReport')
        .mockResolvedValue(mockReport);

      const result = await controller.getPriceChangesReport(dateFrom, dateTo);

      expect(service.generatePriceChangesReport).toHaveBeenCalledWith(
        new Date(dateFrom),
        new Date(dateTo),
      );
      expect(result).toEqual(mockReport);
    });
  });
});
