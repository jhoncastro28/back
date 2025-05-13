import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  DiscountType,
  FilterDiscountDto,
  UpdateDiscountDto,
} from './dto';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let prismaService: PrismaService;

  // Mock for Prisma service
  const mockPrismaService = {
    price: {
      findUnique: jest.fn(),
    },
    discount: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      const mockPrice = {
        id: 1,
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const mockDiscount = {
        id: 1,
        name: createDiscountDto.name,
        description: createDiscountDto.description,
        type: createDiscountDto.type,
        value: createDiscountDto.value,
        startDate: new Date(createDiscountDto.startDate),
        endDate: new Date(createDiscountDto.endDate),
        isActive: true,
        priceId: createDiscountDto.priceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: {
          id: 1,
          purchasePrice: 100,
          sellingPrice: 150,
          product: {
            id: 1,
            name: 'Test Product',
          },
        },
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);
      mockPrismaService.discount.create.mockResolvedValue(mockDiscount);

      // Act
      const result = await service.create(createDiscountDto);

      // Assert
      expect(result).toEqual(mockDiscount);
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: createDiscountDto.priceId },
      });
      expect(prismaService.discount.create).toHaveBeenCalledWith({
        data: {
          ...createDiscountDto,
          startDate: new Date(createDiscountDto.startDate),
          endDate: new Date(createDiscountDto.endDate),
        },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if price does not exist', async () => {
      // Arrange
      const createDiscountDto: CreateDiscountDto = {
        name: 'Summer Sale',
        description: 'Special discount for summer season',
        type: DiscountType.PERCENTAGE,
        value: 10,
        startDate: '2023-06-01T00:00:00Z',
        endDate: '2023-08-31T23:59:59Z',
        priceId: 999, // Non-existent ID
      };

      mockPrismaService.price.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDiscountDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: createDiscountDto.priceId },
      });
      expect(prismaService.discount.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated discounts', async () => {
      // Arrange
      const filterDto: FilterDiscountDto = {
        page: 1,
        limit: 10,
      };

      const mockDiscounts = [
        {
          id: 1,
          name: 'Summer Sale',
          type: DiscountType.PERCENTAGE,
          value: 10,
          isActive: true,
          price: {
            id: 1,
            purchasePrice: 100,
            sellingPrice: 150,
            product: {
              id: 1,
              name: 'Test Product',
            },
          },
        },
      ];

      const mockTotal = 1;

      mockPrismaService.discount.count.mockResolvedValue(mockTotal);
      mockPrismaService.discount.findMany.mockResolvedValue(mockDiscounts);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(result).toEqual({
        data: mockDiscounts,
        meta: {
          total: mockTotal,
          page: filterDto.page,
          limit: filterDto.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      expect(prismaService.discount.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(prismaService.discount.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filterDto: FilterDiscountDto = {
        name: 'Summer',
        type: DiscountType.PERCENTAGE,
        isActive: true,
        priceId: 1,
        page: 1,
        limit: 10,
      };

      mockPrismaService.discount.count.mockResolvedValue(1);
      mockPrismaService.discount.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(filterDto);

      // Assert
      expect(prismaService.discount.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Summer',
            mode: 'insensitive',
          },
          type: DiscountType.PERCENTAGE,
          isActive: true,
          priceId: 1,
        },
      });
    });

    it('should apply date range filters correctly', async () => {
      // Arrange
      const filterDto: FilterDiscountDto = {
        startDateFrom: '2023-01-01T00:00:00Z',
        startDateTo: '2023-12-31T23:59:59Z',
        endDateFrom: '2023-06-01T00:00:00Z',
        endDateTo: '2023-08-31T23:59:59Z',
        page: 1,
        limit: 10,
      };

      mockPrismaService.discount.count.mockResolvedValue(0);
      mockPrismaService.discount.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(filterDto);

      // Assert
      expect(prismaService.discount.count).toHaveBeenCalledWith({
        where: {
          startDate: {
            gte: new Date(filterDto.startDateFrom),
            lte: new Date(filterDto.startDateTo),
          },
          endDate: {
            gte: new Date(filterDto.endDateFrom),
            lte: new Date(filterDto.endDateTo),
          },
        },
      });
    });

    it('should filter by currently valid discounts', async () => {
      // Arrange
      const filterDto: FilterDiscountDto = {
        isCurrentlyValid: true,
        page: 1,
        limit: 10,
      };

      mockPrismaService.discount.count.mockResolvedValue(1);
      mockPrismaService.discount.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(filterDto);

      // Assert
      expect(prismaService.discount.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              startDate: {
                lte: expect.any(Date),
              },
            },
            {
              OR: [
                {
                  endDate: null,
                },
                {
                  endDate: {
                    gte: expect.any(Date),
                  },
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a discount by its ID', async () => {
      // Arrange
      const discountId = 1;
      const mockDiscount = {
        id: discountId,
        name: 'Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
        price: {
          id: 1,
          purchasePrice: 100,
          sellingPrice: 150,
          product: {
            id: 1,
            name: 'Test Product',
          },
        },
      };

      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);

      // Act
      const result = await service.findOne(discountId);

      // Assert
      expect(result).toEqual(mockDiscount);
      expect(prismaService.discount.findUnique).toHaveBeenCalledWith({
        where: { id: discountId },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      // Arrange
      const discountId = 999; // Non-existent ID
      mockPrismaService.discount.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(discountId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.discount.findUnique).toHaveBeenCalled();
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

      const mockDiscount = {
        id: discountId,
        name: 'Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
        priceId: 1,
      };

      const mockUpdatedDiscount = {
        ...mockDiscount,
        name: updateDiscountDto.name,
        value: updateDiscountDto.value,
        price: {
          id: 1,
          purchasePrice: 100,
          sellingPrice: 150,
          product: {
            id: 1,
            name: 'Test Product',
          },
        },
      };

      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      mockPrismaService.discount.update.mockResolvedValue(mockUpdatedDiscount);

      // Act
      const result = await service.update(discountId, updateDiscountDto);

      // Assert
      expect(result).toEqual(mockUpdatedDiscount);
      expect(prismaService.discount.findUnique).toHaveBeenCalledWith({
        where: { id: discountId },
      });
      expect(prismaService.discount.update).toHaveBeenCalledWith({
        where: { id: discountId },
        data: updateDiscountDto,
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should update dates correctly', async () => {
      // Arrange
      const discountId = 1;
      const updateDiscountDto: UpdateDiscountDto = {
        startDate: '2023-07-01T00:00:00Z',
        endDate: '2023-09-30T23:59:59Z',
      };

      const mockDiscount = {
        id: discountId,
        name: 'Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 10,
        startDate: new Date('2023-06-01T00:00:00Z'),
        endDate: new Date('2023-08-31T23:59:59Z'),
        isActive: true,
        priceId: 1,
      };

      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      mockPrismaService.discount.update.mockResolvedValue({
        ...mockDiscount,
        startDate: new Date(updateDiscountDto.startDate),
        endDate: new Date(updateDiscountDto.endDate),
      });

      // Act
      await service.update(discountId, updateDiscountDto);

      // Assert
      expect(prismaService.discount.update).toHaveBeenCalledWith({
        where: { id: discountId },
        data: {
          ...updateDiscountDto,
          startDate: new Date(updateDiscountDto.startDate),
          endDate: new Date(updateDiscountDto.endDate),
        },
        include: {
          price: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      // Arrange
      const discountId = 999; // Non-existent ID
      const updateDiscountDto: UpdateDiscountDto = {
        name: 'Updated Summer Sale',
      };

      mockPrismaService.discount.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(discountId, updateDiscountDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.discount.findUnique).toHaveBeenCalled();
      expect(prismaService.discount.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a discount', async () => {
      // Arrange
      const discountId = 1;
      const mockDiscount = {
        id: discountId,
        name: 'Summer Sale',
        type: DiscountType.PERCENTAGE,
        value: 10,
        isActive: true,
      };

      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      mockPrismaService.discount.delete.mockResolvedValue(mockDiscount);

      // Act
      await service.remove(discountId);

      // Assert
      expect(prismaService.discount.findUnique).toHaveBeenCalledWith({
        where: { id: discountId },
      });
      expect(prismaService.discount.delete).toHaveBeenCalledWith({
        where: { id: discountId },
      });
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      // Arrange
      const discountId = 999; // Non-existent ID
      mockPrismaService.discount.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(discountId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.discount.findUnique).toHaveBeenCalled();
      expect(prismaService.discount.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentDiscounts', () => {
    it('should return current discounts for a price', async () => {
      // Arrange
      const priceId = 1;
      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
      };

      const mockDiscounts = [
        {
          id: 1,
          name: 'Summer Sale',
          type: DiscountType.PERCENTAGE,
          value: 10,
          isActive: true,
        },
      ];

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);
      mockPrismaService.discount.findMany.mockResolvedValue(mockDiscounts);

      // Act
      const result = await service.getCurrentDiscounts(priceId);

      // Assert
      expect(result).toEqual(mockDiscounts);
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: priceId },
      });
      expect(prismaService.discount.findMany).toHaveBeenCalledWith({
        where: {
          priceId,
          isActive: true,
          startDate: {
            lte: expect.any(Date),
          },
          OR: [
            {
              endDate: null,
            },
            {
              endDate: {
                gte: expect.any(Date),
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should throw NotFoundException if price does not exist', async () => {
      // Arrange
      const priceId = 999; // Non-existent ID
      mockPrismaService.price.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCurrentDiscounts(priceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.price.findUnique).toHaveBeenCalled();
      expect(prismaService.discount.findMany).not.toHaveBeenCalled();
    });
  });
});
