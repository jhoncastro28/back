import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  DiscountType,
  FilterDiscountDto,
  UpdateDiscountDto,
} from './dto';

describe('DiscountsController', () => {
  let controller: DiscountsController;
  let service: DiscountsService;

  const mockDiscountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCurrentDiscounts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountsController],
      providers: [
        {
          provide: DiscountsService,
          useValue: mockDiscountsService,
        },
      ],
    }).compile();

    controller = module.get<DiscountsController>(DiscountsController);
    service = module.get<DiscountsService>(DiscountsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a discount', async () => {
      // Arrange
      const createDiscountDto: CreateDiscountDto = {
        name: 'Summer Sale',
        description: 'Special discount for summer season',
        type: DiscountType.PERCENTAGE,
        value: 10,
        startDate: '2023-06-01T00:00:00Z',
        endDate: '2023-08-31T23:59:59Z',
        priceId: 1,
      };

      const expectedResult = {
        id: 1,
        name: 'Summer Sale',
        description: 'Special discount for summer season',
        type: DiscountType.PERCENTAGE,
        value: 10,
        startDate: new Date('2023-06-01T00:00:00Z'),
        endDate: new Date('2023-08-31T23:59:59Z'),
        isActive: true,
        priceId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDiscountsService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createDiscountDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDiscountDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated discounts', async () => {
      // Arrange
      const filterDto: FilterDiscountDto = {
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Summer Sale',
            type: DiscountType.PERCENTAGE,
            value: 10,
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

      mockDiscountsService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a discount by ID', async () => {
      // Arrange
      const discountId = 1;

      const expectedResult = {
        id: discountId,
        name: 'Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
      };

      mockDiscountsService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(discountId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(discountId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentDiscounts', () => {
    it('should return current discounts for a price', async () => {
      // Arrange
      const priceId = 1;

      const expectedResult = [
        {
          id: 1,
          name: 'Summer Sale',
          type: DiscountType.PERCENTAGE,
          value: 10,
          isActive: true,
        },
      ];

      mockDiscountsService.getCurrentDiscounts.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await controller.getCurrentDiscounts(priceId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.getCurrentDiscounts).toHaveBeenCalledWith(priceId);
      expect(service.getCurrentDiscounts).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a discount', async () => {
      // Arrange
      const discountId = 1;
      const updateDiscountDto: UpdateDiscountDto = {
        name: 'Updated Summer Sale',
        value: 15,
      };

      const expectedResult = {
        id: discountId,
        name: 'Updated Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 15,
        isActive: true,
      };

      mockDiscountsService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(discountId, updateDiscountDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(
        discountId,
        updateDiscountDto,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a discount', async () => {
      // Arrange
      const discountId = 1;

      mockDiscountsService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(discountId);

      // Assert
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(discountId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
