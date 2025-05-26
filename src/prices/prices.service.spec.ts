import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceDto, FilterPriceDto } from './dto';
import { PricesService } from './prices.service';

describe('PricesService', () => {
  let service: PricesService;
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
    discounts: [],
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: PrismaService,
          useValue: {
            price: {
              create: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Price created successfully',
                  price: mockPrice,
                });
              }),
              findUnique: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Price found successfully',
                  price: mockPrice,
                });
              }),
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              findFirst: jest.fn().mockImplementation((params) => {
                return Promise.resolve({
                  message: 'Current price retrieved successfully',
                  price: mockPrice,
                });
              }),
              findMany: jest.fn().mockImplementation((_params) => {
                return Promise.resolve([mockPrice]);
              }),
              update: jest.fn().mockImplementation((_params) => {
                return Promise.resolve({
                  message: 'Price updated successfully',
                  price: mockPrice,
                });
              }),
              count: jest.fn().mockResolvedValue(1),
            },
            product: {
              findUnique: jest.fn().mockResolvedValue(mockPrice.product),
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

    service = module.get<PricesService>(PricesService);
    prismaService = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new price', async () => {
      const createDto = {
        productId: 1,
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const result = await service.create(createDto);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.price.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 1,
            purchasePrice: 100,
            sellingPrice: 150,
          }),
        }),
      );
      expect(result).toEqual({
        message: 'Price created successfully',
        price: mockPrice,
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const createPriceDto: CreatePriceDto = {
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 999,
        isCurrentPrice: true,
      };

      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(null);

      await expect(service.create(createPriceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.price.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated prices', async () => {
      const filterDto: FilterPriceDto = {
        page: 1,
        limit: 10,
      };

      jest
        .spyOn(prismaService.price, 'findMany')
        .mockResolvedValue([mockPrice]);
      jest.spyOn(prismaService.price, 'count').mockResolvedValue(1);

      const result = await service.findAll(filterDto);

      expect(prismaService.price.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result.data).toEqual([mockPrice]);
      expect(result.meta.total).toBe(1);
      expect(result.message).toBe('Prices retrieved successfully');
    });

    it('should handle search filters', async () => {
      const filterDto: FilterPriceDto = {
        productId: 1,
        isCurrentPrice: true,
      };

      jest
        .spyOn(prismaService.price, 'findMany')
        .mockResolvedValue([mockPrice]);
      jest.spyOn(prismaService.price, 'count').mockResolvedValue(1);

      const result = await service.findAll(filterDto);

      expect(prismaService.price.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productId: filterDto.productId,
            isCurrentPrice: filterDto.isCurrentPrice,
          },
        }),
      );
      expect(result.data).toEqual([mockPrice]);
    });
  });

  describe('findOne', () => {
    it('should return a price by id', async () => {
      const result = await service.findOne(1);

      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          product: true,
          discounts: true,
        },
      });
      expect(result).toEqual({
        message: 'Price found successfully',
        price: mockPrice,
      });
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(prismaService.price, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a price', async () => {
      const updateDto = {
        purchasePrice: 200,
        sellingPrice: 300,
      };

      const result = await service.update(1, updateDto);

      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.price.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: updateDto,
        }),
      );
      expect(result).toEqual({
        message: 'Price updated successfully',
        price: mockPrice,
      });
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(prismaService.price, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(999, { purchasePrice: 200, sellingPrice: 300 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentPriceForProduct', () => {
    it('should return current price for a product', async () => {
      const result = await service.getCurrentPriceForProduct(1);

      expect(prismaService.price.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productId: 1,
            isCurrentPrice: true,
          },
        }),
      );
      expect(result).toEqual({
        message: 'Current price retrieved successfully',
        price: mockPrice,
      });
    });

    it('should throw NotFoundException if no current price found', async () => {
      jest.spyOn(prismaService.price, 'findFirst').mockResolvedValue(null);

      await expect(service.getCurrentPriceForProduct(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
