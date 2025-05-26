import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountsService } from './discounts.service';
import { DiscountType } from './dto';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let prismaService: PrismaService;
  let paginationService: PaginationService;

  const mockPrice = {
    id: 1,
    productId: 1,
    purchasePrice: new Decimal(100),
    sellingPrice: new Decimal(150),
    isCurrentPrice: true,
    validFrom: new Date(),
    validTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      currentStock: 10,
      minQuantity: 5,
      maxQuantity: 100,
      isActive: true,
      supplierId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockDiscount = {
    id: 1,
    name: 'Summer Sale',
    description: 'Special summer discount',
    type: DiscountType.PERCENTAGE,
    value: new Decimal(10),
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    isActive: true,
    priceId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    price: mockPrice,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: PrismaService,
          useValue: {
            discount: {
              create: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Discount created successfully',
                  discount: mockDiscount,
                });
              }),
              findUnique: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Discount found successfully',
                  discount: mockDiscount,
                });
              }),
              findMany: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Current discounts retrieved successfully',
                  discounts: [mockDiscount],
                });
              }),
              update: jest.fn().mockResolvedValue(mockDiscount),
              count: jest.fn().mockResolvedValue(1),
            },
            price: {
              findUnique: jest.fn().mockResolvedValue(mockPrice),
            },
          },
        },
        {
          provide: PaginationService,
          useValue: {
            getPaginationSkip: jest.fn().mockReturnValue(0),
            createPaginationObject: jest
              .fn()
              .mockImplementation((data, total, page, limit, message) => ({
                data,
                meta: {
                  total,
                  page,
                  limit,
                  totalPages: Math.ceil(total / limit),
                  hasNextPage: page * limit < total,
                  hasPreviousPage: page > 1,
                },
                message,
              })),
          },
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
    prismaService = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new discount', async () => {
      const createDto = {
        name: 'Summer Sale',
        description: 'Special summer discount',
        type: DiscountType.PERCENTAGE,
        value: 10,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        priceId: 1,
      };

      const result = await service.create(createDto);

      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.discount.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          startDate: new Date(createDto.startDate),
          endDate: new Date(createDto.endDate),
        },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual({
        message: 'Discount created successfully',
        discount: mockDiscount,
      });
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(prismaService.price, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Summer Sale',
          description: 'Special summer discount',
          type: DiscountType.PERCENTAGE,
          value: 10,
          priceId: 1,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated discounts', async () => {
      jest
        .spyOn(prismaService.discount, 'findMany')
        .mockResolvedValue([mockDiscount]);
      jest.spyOn(prismaService.discount, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        isActive: true,
      });

      expect(prismaService.discount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 10,
          include: {
            price: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.data).toEqual([mockDiscount]);
      expect(result.meta.total).toBe(1);
    });

    it('should handle search filters', async () => {
      jest
        .spyOn(prismaService.discount, 'findMany')
        .mockResolvedValue([mockDiscount]);
      jest.spyOn(prismaService.discount, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        name: 'Summer',
        type: DiscountType.PERCENTAGE,
        isActive: true,
        priceId: 1,
        isCurrentlyValid: true,
      });

      expect(prismaService.discount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Summer', mode: 'insensitive' },
            type: DiscountType.PERCENTAGE,
            isActive: true,
            priceId: 1,
            AND: expect.any(Array),
          }),
        }),
      );
      expect(result.data).toEqual([mockDiscount]);
    });

    it('should handle date filters', async () => {
      jest
        .spyOn(prismaService.discount, 'findMany')
        .mockResolvedValue([mockDiscount]);
      jest.spyOn(prismaService.discount, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        startDateFrom: '2024-01-01',
        startDateTo: '2024-12-31',
        endDateFrom: '2024-06-01',
        endDateTo: '2024-12-31',
      });

      expect(prismaService.discount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
            endDate: {
              gte: new Date('2024-06-01'),
              lte: new Date('2024-12-31'),
            },
          }),
        }),
      );
      expect(result.data).toEqual([mockDiscount]);
    });
  });

  describe('findOne', () => {
    it('should return a discount by id', async () => {
      const result = await service.findOne(1);

      expect(prismaService.discount.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result).toEqual({
        message: 'Discount found successfully',
        discount: mockDiscount,
      });
    });

    it('should throw NotFoundException for non-existent discount', async () => {
      jest.spyOn(prismaService.discount, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a discount', async () => {
      jest
        .spyOn(prismaService.discount, 'findUnique')
        .mockResolvedValue(mockDiscount);
      jest.spyOn(prismaService.discount, 'update').mockResolvedValue({
        ...mockDiscount,
        name: 'Extended Summer Sale',
        description: 'Extended special summer discount',
        endDate: new Date('2024-09-30'),
      });

      const result = await service.update(1, {
        name: 'Extended Summer Sale',
        description: 'Extended special summer discount',
        endDate: '2024-09-30',
      });

      expect(prismaService.discount.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Extended Summer Sale',
          description: 'Extended special summer discount',
          endDate: new Date('2024-09-30'),
        },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(result.name).toBe('Extended Summer Sale');
      expect(result.endDate).toEqual(new Date('2024-09-30'));
    });

    it('should throw NotFoundException for non-existent discount', async () => {
      jest.spyOn(prismaService.discount, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(1, {
          name: 'Extended Summer Sale',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentDiscounts', () => {
    it('should return empty array when no current discounts', async () => {
      jest.spyOn(prismaService.discount, 'findMany').mockResolvedValue([]);
      const result = await service.getCurrentDiscounts(1);
      expect(result).toEqual([]);
    });

    it('should return current discounts for a price', async () => {
      const now = new Date();
      const mockCurrentDiscount = {
        ...mockDiscount,
        startDate: new Date(now.getTime() - 1000), // 1 second ago
        endDate: new Date(now.getTime() + 1000), // 1 second in future
      };

      jest
        .spyOn(prismaService.discount, 'findMany')
        .mockResolvedValue([mockCurrentDiscount]);

      const result = await service.getCurrentDiscounts(1);
      expect(result).toEqual([mockCurrentDiscount]);
    });

    it('should throw NotFoundException when price does not exist', async () => {
      jest.spyOn(prismaService.price, 'findUnique').mockResolvedValue(null);

      await expect(service.getCurrentDiscounts(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
