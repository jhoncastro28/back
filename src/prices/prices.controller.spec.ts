import { Test, TestingModule } from '@nestjs/testing';
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';

describe('PricesController', () => {
  let controller: PricesController;
  let service: PricesService;

  const mockPricesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCurrentPriceForProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricesController],
      providers: [
        {
          provide: PricesService,
          useValue: mockPricesService,
        },
      ],
    }).compile();

    controller = module.get<PricesController>(PricesController);
    service = module.get<PricesService>(PricesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a price', async () => {
      // Arrange
      const createPriceDto: CreatePriceDto = {
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
      };

      const expectedResult = {
        id: 1,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
        validFrom: new Date(),
        validTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPricesService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createPriceDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createPriceDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated prices', async () => {
      // Arrange
      const filterDto: FilterPriceDto = {
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [
          {
            id: 1,
            purchasePrice: 100,
            sellingPrice: 150,
            productId: 1,
            isCurrentPrice: true,
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

      mockPricesService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a price by ID', async () => {
      // Arrange
      const priceId = 1;

      const expectedResult = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
      };

      mockPricesService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(priceId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(priceId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentPriceForProduct', () => {
    it('should return the current price for a product', async () => {
      // Arrange
      const productId = 1;

      const expectedResult = {
        id: 1,
        purchasePrice: 100,
        sellingPrice: 150,
        productId,
        isCurrentPrice: true,
      };

      mockPricesService.getCurrentPriceForProduct.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await controller.getCurrentPriceForProduct(productId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.getCurrentPriceForProduct).toHaveBeenCalledWith(productId);
      expect(service.getCurrentPriceForProduct).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a price', async () => {
      // Arrange
      const priceId = 1;
      const updatePriceDto: UpdatePriceDto = {
        sellingPrice: 200,
      };

      const expectedResult = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 200,
        productId: 1,
        isCurrentPrice: true,
      };

      mockPricesService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(priceId, updatePriceDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(priceId, updatePriceDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a price', async () => {
      // Arrange
      const priceId = 1;

      mockPricesService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(priceId);

      // Assert
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(priceId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
