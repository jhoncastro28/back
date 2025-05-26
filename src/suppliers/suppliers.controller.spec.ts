import { Test, TestingModule } from '@nestjs/testing';
import { DocumentType } from '../clients/entities/client.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSuppliersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSupplier', () => {
    const createSupplierDto = {
      name: 'Test Supplier',
      email: 'test@supplier.com',
      phoneNumber: '1234567890',
      address: 'Test Address',
      documentType: DocumentType.CC,
      documentNumber: '12345678901',
      contactName: 'John Doe',
    };

    it('should create a supplier successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Supplier created successfully',
        data: {
          id: 1,
          ...createSupplierDto,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockSuppliersService.create.mockResolvedValue(expectedResult);

      const result = await controller.createSupplier(createSupplierDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createSupplierDto);
    });
  });

  describe('getSuppliers', () => {
    const query = {
      page: 1,
      limit: 10,
      isActive: true,
      search: 'test',
    };

    it('should return paginated suppliers list', async () => {
      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Test Supplier',
            isActive: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      mockSuppliersService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.getSuppliers(query);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getSupplierById', () => {
    const supplierId = 1;

    it('should return a supplier by id', async () => {
      const expectedResult = {
        success: true,
        data: {
          id: supplierId,
          name: 'Test Supplier',
          isActive: true,
        },
      };

      mockSuppliersService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.getSupplierById(supplierId);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(supplierId);
    });
  });

  describe('updateSupplier', () => {
    const supplierId = 1;
    const updateSupplierDto = {
      name: 'Updated Supplier',
      email: 'updated@supplier.com',
    };

    it('should update a supplier successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Supplier updated successfully',
        data: {
          id: supplierId,
          ...updateSupplierDto,
          isActive: true,
        },
      };

      mockSuppliersService.update.mockResolvedValue(expectedResult);

      const result = await controller.updateSupplier(
        supplierId,
        updateSupplierDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(
        supplierId,
        updateSupplierDto,
      );
    });
  });

  describe('deactivateSupplier', () => {
    const supplierId = 1;

    it('should deactivate a supplier successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Supplier deactivated successfully',
        data: {
          id: supplierId,
          isActive: false,
        },
      };

      mockSuppliersService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.deactivateSupplier(supplierId);

      expect(result).toEqual(expectedResult);
      expect(service.toggleActive).toHaveBeenCalledWith(supplierId, false);
    });
  });

  describe('activateSupplier', () => {
    const supplierId = 1;

    it('should activate a supplier successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Supplier activated successfully',
        data: {
          id: supplierId,
          isActive: true,
        },
      };

      mockSuppliersService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.activateSupplier(supplierId);

      expect(result).toEqual(expectedResult);
      expect(service.toggleActive).toHaveBeenCalledWith(supplierId, true);
    });
  });
});
