import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, FilterDiscountDto, UpdateDiscountDto } from './dto';
import { DiscountType } from './dto/discount.types';

describe('DiscountsController', () => {
  let controller: DiscountsController;
  let discountsService: DiscountsService;
  let toggleActiveService: ToggleActiveService;

  const mockDiscount = {
    id: 1,
    name: 'Summer Sale',
    description: 'Special summer discount',
    type: DiscountType.PERCENTAGE,
    value: new Decimal(10),
    priceId: 1,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    price: {
      id: 1,
      purchasePrice: new Decimal(80),
      sellingPrice: new Decimal(100),
      isCurrentPrice: true,
      validFrom: new Date(),
      validTo: null,
      productId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 1,
        name: 'Test Product',
        description: 'A test product',
      },
    },
  };

  const mockPaginatedResponse = {
    data: [mockDiscount],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Discounts retrieved successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountsController],
      providers: [
        {
          provide: DiscountsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDiscount),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
            findOne: jest.fn().mockResolvedValue(mockDiscount),
            update: jest.fn().mockResolvedValue(mockDiscount),
            getCurrentDiscounts: jest.fn().mockResolvedValue([mockDiscount]),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest.fn().mockImplementation((type, id, data) => {
              if (data.isActive) {
                return Promise.resolve({
                  message: 'Discount activated successfully',
                });
              }
              return Promise.resolve({
                message: 'Discount deactivated successfully',
              });
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<DiscountsController>(DiscountsController);
    discountsService = module.get<DiscountsService>(DiscountsService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(discountsService).toBeDefined();
    expect(toggleActiveService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new discount', async () => {
      const createDto: CreateDiscountDto = {
        name: 'Summer Sale',
        description: 'Special summer discount',
        type: DiscountType.PERCENTAGE,
        value: 10,
        priceId: 1,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
      };

      const result = await controller.create(createDto);
      expect(discountsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockDiscount);
    });
  });

  describe('findAll', () => {
    it('should return paginated discounts', async () => {
      const filterDto: FilterDiscountDto = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      const result = await controller.findAll(filterDto);
      expect(discountsService.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle search filters', async () => {
      const filterDto: FilterDiscountDto = {
        name: 'Summer',
        type: DiscountType.PERCENTAGE,
        isActive: true,
        priceId: 1,
        isCurrentlyValid: true,
      };

      const result = await controller.findAll(filterDto);
      expect(discountsService.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a discount by id', async () => {
      const result = await controller.findOne(1);
      expect(discountsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDiscount);
    });
  });

  describe('getCurrentDiscounts', () => {
    it('should return current discounts for a price', async () => {
      const result = await controller.getCurrentDiscounts(1);
      expect(discountsService.getCurrentDiscounts).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockDiscount]);
    });
  });

  describe('update', () => {
    it('should update a discount', async () => {
      const updateDto: UpdateDiscountDto = {
        name: 'Extended Summer Sale',
        description: 'Extended special summer discount',
        endDate: '2024-09-30',
      };

      const result = await controller.update(1, updateDto);
      expect(discountsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockDiscount);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a discount', async () => {
      const result = await controller.deactivate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'discount',
        1,
        { isActive: false },
      );
      expect(result).toEqual({
        message: 'Discount deactivated successfully',
      });
    });
  });

  describe('activate', () => {
    it('should activate a discount', async () => {
      const result = await controller.activate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'discount',
        1,
        { isActive: true },
      );
      expect(result).toEqual({
        message: 'Discount activated successfully',
      });
    });
  });
});
