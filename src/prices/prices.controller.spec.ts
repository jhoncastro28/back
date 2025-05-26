import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';

describe('PricesController', () => {
  let controller: PricesController;
  let service: PricesService;
  let toggleActiveService: ToggleActiveService;

  const mockPrice = {
    id: 1,
    purchasePrice: new Decimal(100),
    sellingPrice: new Decimal(150),
    productId: 1,
    isCurrentPrice: true,
    validFrom: new Date(),
    validTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 1,
      name: 'Test Product',
      description: 'A test product',
    },
    discounts: [],
  };

  const mockPaginatedResponse = {
    data: [mockPrice],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Prices retrieved successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricesController],
      providers: [
        {
          provide: PricesService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              message: 'Price created successfully',
              price: mockPrice,
            }),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
            findOne: jest.fn().mockResolvedValue({
              message: 'Price found successfully',
              price: mockPrice,
            }),
            update: jest.fn().mockResolvedValue({
              message: 'Price updated successfully',
              price: mockPrice,
            }),
            getCurrentPriceForProduct: jest.fn().mockResolvedValue({
              message: 'Current price retrieved successfully',
              price: mockPrice,
            }),
          },
        },
        {
          provide: ToggleActiveService,
          useValue: {
            toggleActive: jest.fn().mockImplementation((type, id, data) => {
              if (data.isActive) {
                return Promise.resolve({
                  message: 'Price activated successfully',
                  data: { id, isActive: true },
                });
              }
              return Promise.resolve({
                message: 'Price deactivated successfully',
                data: { id, isActive: false },
              });
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PricesController>(PricesController);
    service = module.get<PricesService>(PricesService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(toggleActiveService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new price', async () => {
      const createPriceDto: CreatePriceDto = {
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
      };

      const result = await controller.create(createPriceDto);
      expect(service.create).toHaveBeenCalledWith(createPriceDto);
      expect(result).toEqual({
        message: 'Price created successfully',
        price: mockPrice,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated prices', async () => {
      const filterDto: FilterPriceDto = {
        page: 1,
        limit: 10,
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle search filters', async () => {
      const filterDto: FilterPriceDto = {
        productId: 1,
        isCurrentPrice: true,
      };

      const result = await controller.findAll(filterDto);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a price by id', async () => {
      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Price found successfully',
        price: mockPrice,
      });
    });
  });

  describe('getCurrentPriceForProduct', () => {
    it('should return the current price for a product', async () => {
      const result = await controller.getCurrentPriceForProduct(1);
      expect(service.getCurrentPriceForProduct).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Current price retrieved successfully',
        price: mockPrice,
      });
    });
  });

  describe('update', () => {
    it('should update a price', async () => {
      const updatePriceDto: UpdatePriceDto = {
        sellingPrice: 200,
      };

      const result = await controller.update(1, updatePriceDto);
      expect(service.update).toHaveBeenCalledWith(1, updatePriceDto);
      expect(result).toEqual({
        message: 'Price updated successfully',
        price: mockPrice,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate a price', async () => {
      const result = await controller.deactivate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'price',
        1,
        { isActive: false },
      );
      expect(result).toEqual({
        message: 'Price deactivated successfully',
        data: { id: 1, isActive: false },
      });
    });
  });

  describe('activate', () => {
    it('should activate a price', async () => {
      const result = await controller.activate(1);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'price',
        1,
        { isActive: true },
      );
      expect(result).toEqual({
        message: 'Price activated successfully',
        data: { id: 1, isActive: true },
      });
    });
  });
});
