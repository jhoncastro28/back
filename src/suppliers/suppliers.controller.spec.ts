import { Test, TestingModule } from '@nestjs/testing';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { CreateSupplierDto } from './dto';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;
  let toggleActiveService: ToggleActiveService;

  const mockSuppliersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockToggleActiveService = {
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
        {
          provide: ToggleActiveService,
          useValue: mockToggleActiveService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
    toggleActiveService = module.get<ToggleActiveService>(ToggleActiveService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a supplier', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phoneNumber: '1234567890',
        address: 'Test Address',
      };

      const expectedResult = {
        id: 1,
        ...createSupplierDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSuppliersService.create.mockResolvedValue(expectedResult);

      const result = await controller.createSupplier(createSupplierDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createSupplierDto);
    });
  });

  describe('deactivateSupplier', () => {
    it('should deactivate a supplier', async () => {
      const supplierId = 1;
      const expectedResult = {
        message: 'supplier deactivated successfully',
        data: {
          id: supplierId,
          isActive: false,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.deactivateSupplier(supplierId);

      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'supplier',
        supplierId,
        { isActive: false },
      );
    });
  });

  describe('activateSupplier', () => {
    it('should activate a supplier', async () => {
      const supplierId = 1;
      const expectedResult = {
        message: 'supplier activated successfully',
        data: {
          id: supplierId,
          isActive: true,
        },
      };

      mockToggleActiveService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.activateSupplier(supplierId);

      expect(result).toEqual(expectedResult);
      expect(toggleActiveService.toggleActive).toHaveBeenCalledWith(
        'supplier',
        supplierId,
        { isActive: true },
      );
    });
  });
});
