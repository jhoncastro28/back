import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentType } from './../entities/client.entity';
import { MobileService } from './mobile.service';

describe('MobileService', () => {
  let service: MobileService;
  let prismaService: PrismaService;
  let paginationService: PaginationService;

  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    address: 'Test Address',
    documentType: DocumentType.TI,
    documentNumber: '12345678',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSale = {
    id: 1,
    clientId: 1,
    userId: 'user123',
    saleDate: new Date('2024-03-20T10:00:00.000Z'),
    totalAmount: new Decimal(21.0),
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    saleDetails: [
      {
        id: 1,
        product: {
          id: 1,
          name: 'Product 1',
          description: 'Test Product',
        },
        quantity: 2,
        unitPrice: 10.5,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              findUnique: jest.fn(),
            },
            sale: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
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

    service = module.get<MobileService>(MobileService);
    prismaService = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('getClientOrders', () => {
    it('should return paginated orders for an active client', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);

      const result = await service.getClientOrders(1);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.sale.findMany).toHaveBeenCalledWith({
        where: { clientId: 1 },
        include: expect.any(Object),
        orderBy: { saleDate: 'desc' },
      });
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: '1',
          orderNumber: 'ORD-000001',
          status: 'completed',
          items: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              name: 'Product 1',
              quantity: 2,
              price: 10.5,
            }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException for inactive client', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue({ ...mockClient, isActive: false });

      await expect(service.getClientOrders(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.getClientOrders(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrderDetails', () => {
    it('should return details for a specific order', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findFirst').mockResolvedValue(mockSale);

      const result = await service.getOrderDetails(1, 1);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.sale.findFirst).toHaveBeenCalledWith({
        where: { id: 1, clientId: 1 },
        include: expect.any(Object),
      });
      expect(result.data).toEqual(
        expect.objectContaining({
          id: '1',
          orderNumber: 'ORD-000001',
          status: 'completed',
          store: 'Almendros',
          items: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              name: 'Product 1',
              quantity: 2,
              price: 10.5,
            }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findFirst').mockResolvedValue(null);

      await expect(service.getOrderDetails(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPurchaseHistory', () => {
    it('should return paginated purchase history', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const result = await service.getPurchaseHistory(1, {
        page: 1,
        limit: 10,
        clientId: 1,
      });

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.sale.findMany).toHaveBeenCalledWith({
        where: { clientId: 1 },
        include: expect.any(Object),
        orderBy: { saleDate: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: '1',
          orderNumber: 'ORD-000001',
          status: 'completed',
          items: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              name: 'Product 1',
              quantity: 2,
              price: 10.5,
            }),
          ]),
        }),
      );
    });

    it('should handle default pagination values', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const result = await service.getPurchaseHistory(1, { clientId: 1 });

      expect(prismaService.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should throw NotFoundException for inactive client', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue({ ...mockClient, isActive: false });

      await expect(
        service.getPurchaseHistory(1, { clientId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
