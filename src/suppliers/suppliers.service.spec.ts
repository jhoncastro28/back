/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { DocumentType } from '../clients/entities/client.entity';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prismaService: PrismaService;
  let paginationService: PaginationService;

  const mockPrismaService = {
    supplier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPaginationService = {
    getPaginationSkip: jest.fn(),
    createPaginationObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    prismaService = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSupplierDto: CreateSupplierDto = {
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
        id: 1,
        ...createSupplierDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: [],
        _count: { products: 0, inventoryMovements: 0 },
      };

      mockPrismaService.supplier.create.mockResolvedValue(expectedResult);

      const result = await service.create(createSupplierDto);

      expect(result).toEqual({
        success: true,
        message: 'Supplier created successfully',
        data: expectedResult,
      });
      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: createSupplierDto,
        include: expect.any(Object),
      });
    });

    it('should handle duplicate supplier error', async () => {
      mockPrismaService.supplier.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '2.0.0',
        }),
      );

      await expect(service.create(createSupplierDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    const mockSuppliers = [
      {
        id: 1,
        name: 'Supplier 1',
        isActive: true,
        products: [],
        _count: { products: 0, inventoryMovements: 0 },
      },
    ];

    it('should return paginated suppliers list', async () => {
      const query = { page: 1, limit: 10, isActive: true };
      const total = 1;
      const paginatedResponse = {
        data: mockSuppliers,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
        },
      };

      mockPaginationService.getPaginationSkip.mockReturnValue(0);
      mockPrismaService.supplier.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaService.supplier.count.mockResolvedValue(total);
      mockPaginationService.createPaginationObject.mockReturnValue(
        paginatedResponse,
      );

      const result = await service.findAll(query);

      expect(result).toEqual(paginatedResponse);
      expect(mockPrismaService.supplier.findMany).toHaveBeenCalled();
      expect(mockPrismaService.supplier.count).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const supplierId = 1;
    const mockSupplier = {
      id: supplierId,
      name: 'Test Supplier',
      isActive: true,
      products: [],
      _count: { products: 0, inventoryMovements: 0 },
    };

    it('should return a supplier by id', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);

      const result = await service.findOne(supplierId);

      expect(result).toEqual({
        success: true,
        data: mockSupplier,
      });
      expect(mockPrismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: supplierId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne(supplierId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const supplierId = 1;
    const updateSupplierDto: UpdateSupplierDto = {
      name: 'Updated Supplier',
      email: 'updated@supplier.com',
    };

    it('should update a supplier successfully', async () => {
      const updatedSupplier = {
        id: supplierId,
        ...updateSupplierDto,
        isActive: true,
        products: [],
        _count: { products: 0, inventoryMovements: 0 },
      };

      mockPrismaService.supplier.update.mockResolvedValue(updatedSupplier);

      const result = await service.update(supplierId, updateSupplierDto);

      expect(result).toEqual({
        success: true,
        message: 'Supplier updated successfully',
        data: updatedSupplier,
      });
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: supplierId },
        data: updateSupplierDto,
        include: expect.any(Object),
      });
    });

    it('should handle supplier not found error', async () => {
      mockPrismaService.supplier.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '2.0.0',
        }),
      );

      await expect(
        service.update(supplierId, updateSupplierDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    const supplierId = 1;
    const mockSupplierData = {
      id: supplierId,
      name: 'Test Supplier',
      isActive: true,
      contactName: 'John Doe',
      email: 'test@supplier.com',
      phoneNumber: '1234567890',
      address: 'Test Address',
      documentType: DocumentType.CC,
      documentNumber: '12345678901',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Reset the mock implementation for each test
      mockPrismaService.supplier.findUnique.mockReset();
      mockPrismaService.supplier.update.mockReset();
    });

    it('should activate a supplier', async () => {
      const activatedSupplier = {
        ...mockSupplierData,
        isActive: true,
      };

      mockPrismaService.supplier.update.mockResolvedValue(activatedSupplier);

      const result = await service.toggleActive(supplierId, true);

      expect(result).toEqual({
        success: true,
        message: 'Supplier activated successfully',
        data: activatedSupplier,
      });
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: supplierId },
        data: { isActive: true },
        select: expect.any(Object),
      });
    });

    it('should deactivate a supplier with no active products', async () => {
      const deactivatedSupplier = {
        ...mockSupplierData,
        isActive: false,
      };

      // Mock that there are no active products
      jest
        .spyOn(service as any, 'checkForActiveProducts')
        .mockResolvedValue(false);
      mockPrismaService.supplier.update.mockResolvedValue(deactivatedSupplier);

      const result = await service.toggleActive(supplierId, false);

      expect(result).toEqual({
        success: true,
        message: 'Supplier deactivated successfully',
        data: deactivatedSupplier,
      });
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: supplierId },
        data: { isActive: false },
        select: expect.any(Object),
      });
    });

    it('should not deactivate a supplier with active products', async () => {
      // Mock that there are 2 active products
      jest.spyOn(service as any, 'checkForActiveProducts').mockResolvedValue(2);

      const result = await service.toggleActive(supplierId, false);

      expect(result).toEqual({
        success: false,
        message:
          'Cannot deactivate supplier. There are 2 active products associated with this supplier.',
        data: null,
      });
      expect(mockPrismaService.supplier.update).not.toHaveBeenCalled();
    });

    it('should handle supplier not found error', async () => {
      mockPrismaService.supplier.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '2.0.0',
        }),
      );

      await expect(service.toggleActive(supplierId, true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
