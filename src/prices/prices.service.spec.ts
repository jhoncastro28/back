import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';
import { PricesService } from './prices.service';

describe('PricesService', () => {
  let service: PricesService;
  let prismaService: PrismaService;

  // Mock for Prisma service
  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    price: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a price', async () => {
      // Arrange
      const createPriceDto: CreatePriceDto = {
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
      };

      const mockProduct = {
        id: 1,
        name: 'Test Product',
      };

      const mockPrice = {
        id: 1,
        purchasePrice: createPriceDto.purchasePrice,
        sellingPrice: createPriceDto.sellingPrice,
        productId: createPriceDto.productId,
        isCurrentPrice: createPriceDto.isCurrentPrice,
        validFrom: new Date(),
        validTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.price.create.mockResolvedValue(mockPrice);

      // Act
      const result = await service.create(createPriceDto);

      // Assert
      expect(result).toEqual(mockPrice);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: createPriceDto.productId },
      });
      expect(prismaService.price.updateMany).toHaveBeenCalledWith({
        where: {
          productId: createPriceDto.productId,
          isCurrentPrice: true,
        },
        data: {
          isCurrentPrice: false,
          validTo: expect.any(Date),
        },
      });
      expect(prismaService.price.create).toHaveBeenCalledWith({
        data: createPriceDto,
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const createPriceDto: CreatePriceDto = {
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 999, // Non-existent ID
        isCurrentPrice: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createPriceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: createPriceDto.productId },
      });
      expect(prismaService.price.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated prices', async () => {
      // Arrange
      const filterDto: FilterPriceDto = {
        page: 1,
        limit: 10,
      };

      const mockPrices = [
        {
          id: 1,
          purchasePrice: 100,
          sellingPrice: 150,
          productId: 1,
          isCurrentPrice: true,
          product: { id: 1, name: 'Test Product' },
        },
      ];

      const mockTotal = 1;

      mockPrismaService.price.count.mockResolvedValue(mockTotal);
      mockPrismaService.price.findMany.mockResolvedValue(mockPrices);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(result).toEqual({
        data: mockPrices,
        meta: {
          total: mockTotal,
          page: filterDto.page,
          limit: filterDto.limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      expect(prismaService.price.count).toHaveBeenCalledWith({
        where: {},
      });
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
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filterDto: FilterPriceDto = {
        productId: 1,
        isCurrentPrice: true,
        page: 1,
        limit: 10,
      };

      mockPrismaService.price.count.mockResolvedValue(1);
      mockPrismaService.price.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(filterDto);

      // Assert
      expect(prismaService.price.count).toHaveBeenCalledWith({
        where: {
          productId: filterDto.productId,
          isCurrentPrice: filterDto.isCurrentPrice,
        },
      });
      expect(prismaService.price.findMany).toHaveBeenCalledWith({
        where: {
          productId: filterDto.productId,
          isCurrentPrice: filterDto.isCurrentPrice,
        },
        skip: 0,
        take: 10,
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a price by its ID', async () => {
      // Arrange
      const priceId = 1;
      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
        product: { id: 1, name: 'Test Product' },
        discounts: [],
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);

      // Act
      const result = await service.findOne(priceId);

      // Assert
      expect(result).toEqual(mockPrice);
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: priceId },
        include: {
          product: true,
          discounts: true,
        },
      });
    });

    it('should throw NotFoundException if price does not exist', async () => {
      // Arrange
      const priceId = 999; // Non-existent ID
      mockPrismaService.price.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(priceId)).rejects.toThrow(NotFoundException);
      expect(prismaService.price.findUnique).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a price', async () => {
      // Arrange
      const priceId = 1;
      const updatePriceDto: UpdatePriceDto = {
        sellingPrice: 200,
      };

      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true,
      };

      const mockUpdatedPrice = {
        ...mockPrice,
        sellingPrice: updatePriceDto.sellingPrice,
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);
      mockPrismaService.price.update.mockResolvedValue(mockUpdatedPrice);

      // Act
      const result = await service.update(priceId, updatePriceDto);

      // Assert
      expect(result).toEqual(mockUpdatedPrice);
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: priceId },
      });
      expect(prismaService.price.update).toHaveBeenCalledWith({
        where: { id: priceId },
        data: updatePriceDto,
      });
    });

    it('should update other prices when making this the current price', async () => {
      // Arrange
      const priceId = 1;
      const updatePriceDto: UpdatePriceDto = {
        isCurrentPrice: true,
      };

      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: false,
      };

      const mockUpdatedPrice = {
        ...mockPrice,
        isCurrentPrice: true,
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);
      mockPrismaService.price.update.mockResolvedValue(mockUpdatedPrice);

      // Act
      const result = await service.update(priceId, updatePriceDto);

      // Assert
      expect(result).toEqual(mockUpdatedPrice);
      expect(prismaService.price.updateMany).toHaveBeenCalledWith({
        where: {
          productId: mockPrice.productId,
          isCurrentPrice: true,
          id: { not: priceId },
        },
        data: {
          isCurrentPrice: false,
          validTo: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if price does not exist', async () => {
      // Arrange
      const priceId = 999; // Non-existent ID
      const updatePriceDto: UpdatePriceDto = {
        sellingPrice: 200,
      };

      mockPrismaService.price.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(priceId, updatePriceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.price.findUnique).toHaveBeenCalled();
      expect(prismaService.price.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a price', async () => {
      // Arrange
      const priceId = 1;
      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: false,
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);
      mockPrismaService.price.delete.mockResolvedValue(mockPrice);

      // Act
      await service.remove(priceId);

      // Assert
      expect(prismaService.price.findUnique).toHaveBeenCalledWith({
        where: { id: priceId },
      });
      expect(prismaService.price.delete).toHaveBeenCalledWith({
        where: { id: priceId },
      });
    });

    it('should throw an error when trying to delete the current price', async () => {
      // Arrange
      const priceId = 1;
      const mockPrice = {
        id: priceId,
        purchasePrice: 100,
        sellingPrice: 150,
        productId: 1,
        isCurrentPrice: true, // Current price
      };

      mockPrismaService.price.findUnique.mockResolvedValue(mockPrice);

      // Act & Assert
      await expect(service.remove(priceId)).rejects.toThrow(
        'Cannot delete the current price. Create a new price or update another price to be current first.',
      );
      expect(prismaService.price.findUnique).toHaveBeenCalled();
      expect(prismaService.price.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if price does not exist', async () => {
      // Arrange
      const priceId = 999; // Non-existent ID
      mockPrismaService.price.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(priceId)).rejects.toThrow(NotFoundException);
      expect(prismaService.price.findUnique).toHaveBeenCalled();
      expect(prismaService.price.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentPriceForProduct', () => {
    it('should return the current price for a product', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
      };

      const mockPrice = {
        id: 1,
        purchasePrice: 100,
        sellingPrice: 150,
        productId,
        isCurrentPrice: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.price.findFirst.mockResolvedValue(mockPrice);

      // Act
      const result = await service.getCurrentPriceForProduct(productId);

      // Assert
      expect(result).toEqual(mockPrice);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(prismaService.price.findFirst).toHaveBeenCalledWith({
        where: {
          productId,
          isCurrentPrice: true,
        },
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      const productId = 999; // Non-existent ID
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getCurrentPriceForProduct(productId),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.price.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no current price exists', async () => {
      // Arrange
      const productId = 1;
      const mockProduct = {
        id: productId,
        name: 'Test Product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.price.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getCurrentPriceForProduct(productId),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.product.findUnique).toHaveBeenCalled();
      expect(prismaService.price.findFirst).toHaveBeenCalled();
    });
  });
});
