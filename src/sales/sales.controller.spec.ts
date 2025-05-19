import { Test, TestingModule } from '@nestjs/testing';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { CreateSaleDto } from './dto/sale.dto';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController', () => {
  let controller: SalesController;
  let service: SalesService;
  let toggleActiveService: ToggleActiveService;

  const mockSalesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findByClient: jest.fn(),
    getClientPurchaseSummary: jest.fn(),
    getSaleDetails: jest.fn(),
  };

  const mockToggleActiveService = {
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesService,
          useValue: mockSalesService,
        },
        {
          provide: ToggleActiveService,
          useValue: mockToggleActiveService,
        },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    service = module.get<SalesService>(SalesService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale', async () => {
      const createSaleDto: CreateSaleDto = {
        clientId: 1,
        details: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 10.99,
          },
        ],
      };

      const mockUser = { id: 'user123' };

      const expectedResult = {
        id: 1,
        clientId: 1,
        total: 100,
        createdAt: new Date(),
      };

      mockSalesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createSaleDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createSaleDto, mockUser.id);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a sale', async () => {
      const saleId = 1;
      const expectedResult = {
        message: 'sale deactivated successfully',
        data: {
          id: saleId,
          isActive: false,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.deactivate(saleId);

      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'sale',
        saleId,
        { isActive: false },
      );
    });
  });

  describe('activate', () => {
    it('should activate a sale', async () => {
      const saleId = 1;
      const expectedResult = {
        message: 'sale activated successfully',
        data: {
          id: saleId,
          isActive: true,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.activate(saleId);

      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'sale',
        saleId,
        { isActive: true },
      );
    });
  });
});
