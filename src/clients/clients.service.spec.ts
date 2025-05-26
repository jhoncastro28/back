import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginationService } from '../common/services/pagination.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';
import { DocumentType } from './entities/client.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let paginationService: PaginationService;

  const mockClient = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    address: 'Test Address',
    documentType: DocumentType.CC,
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
        unitPrice: new Decimal(10.5),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            sale: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
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

    service = module.get<ClientsService>(ClientsService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(paginationService).toBeDefined();
  });

  describe('loginWithDocument', () => {
    it('should authenticate a client with valid document credentials', async () => {
      jest
        .spyOn(prismaService.client, 'findFirst')
        .mockResolvedValue(mockClient);

      const result = await service.loginWithDocument({
        documentType: DocumentType.CC,
        documentNumber: '12345678',
      });

      expect(prismaService.client.findFirst).toHaveBeenCalledWith({
        where: {
          documentType: DocumentType.CC,
          documentNumber: '12345678',
          isActive: true,
        },
      });
      expect(result).toEqual({
        message: 'Login successful',
        user: {
          id: mockClient.id,
          firstName: 'John',
          lastName: 'Doe',
          email: mockClient.email,
          documentType: mockClient.documentType,
          documentNumber: mockClient.documentNumber,
          role: 'CLIENT',
          isActive: mockClient.isActive,
          createdAt: mockClient.createdAt,
          updatedAt: mockClient.updatedAt,
        },
        token: 'mock-token',
      });
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findFirst').mockResolvedValue(null);

      await expect(
        service.loginWithDocument({
          documentType: DocumentType.CC,
          documentNumber: '12345678',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      jest.spyOn(prismaService.client, 'create').mockResolvedValue(mockClient);

      const result = await service.create({
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        address: 'Test Address',
        documentType: DocumentType.CC,
        documentNumber: '12345678',
      });

      expect(prismaService.client.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '123456789',
          address: 'Test Address',
          documentType: DocumentType.CC,
          documentNumber: '12345678',
        },
      });
      expect(result).toEqual({
        message: 'Client created successfully',
        client: mockClient,
      });
    });

    it('should throw BadRequestException on creation error', async () => {
      jest
        .spyOn(prismaService.client, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.create({
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '123456789',
          address: 'Test Address',
          documentType: DocumentType.CC,
          documentNumber: '12345678',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      jest
        .spyOn(prismaService.client, 'findMany')
        .mockResolvedValue([mockClient]);
      jest.spyOn(prismaService.client, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        isActive: true,
      });

      expect(prismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: { isActive: true },
        }),
      );
      expect(result.data).toEqual([mockClient]);
      expect(result.meta.total).toBe(1);
    });

    it('should handle search filters', async () => {
      jest
        .spyOn(prismaService.client, 'findMany')
        .mockResolvedValue([mockClient]);
      jest.spyOn(prismaService.client, 'count').mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        name: 'John',
        email: 'john@example.com',
        phoneNumber: '123456789',
        documentNumber: '12345678',
      });

      expect(prismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'John', mode: 'insensitive' },
            email: 'john@example.com',
            phoneNumber: { contains: '123456789', mode: 'insensitive' },
            documentNumber: '12345678',
          }),
        }),
      );
      expect(result.data).toEqual([mockClient]);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);

      const result = await service.findOne(1);
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        message: 'Client found successfully',
        client: mockClient,
      });
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.client, 'update').mockResolvedValue({
        ...mockClient,
        name: 'John Updated',
        email: 'john.updated@example.com',
      });

      const result = await service.update(1, {
        name: 'John Updated',
        email: 'john.updated@example.com',
      });

      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'John Updated',
          email: 'john.updated@example.com',
        },
      });
      expect(result.client.name).toBe('John Updated');
      expect(result.client.email).toBe('john.updated@example.com');
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(
        service.update(1, {
          name: 'John Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPurchaseHistory', () => {
    it('should return client purchase history', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const result = await service.getPurchaseHistory(1, {});

      expect(prismaService.sale.findMany).toHaveBeenCalledWith({
        where: {
          clientId: 1,
        },
        include: {
          saleDetails: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should handle date filters', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');
      const result = await service.getPurchaseHistory(1, { dateFrom, dateTo });

      expect(prismaService.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            clientId: 1,
            saleDate: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.getPurchaseHistory(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generatePurchaseReport', () => {
    it('should generate purchase report for all time', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const result = await service.generatePurchaseReport(1);

      expect(prismaService.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 1 },
          include: expect.any(Object),
        }),
      );
      expect(result.data.summary.totalPurchases).toBe(1);
      expect(result.data.summary.totalSpent).toBe(21.0);
    });

    it('should handle period filter', async () => {
      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest.spyOn(prismaService.sale, 'findMany').mockResolvedValue([mockSale]);
      jest.spyOn(prismaService.sale, 'count').mockResolvedValue(1);

      const result = await service.generatePurchaseReport(1, 'month');

      expect(prismaService.sale.findMany).toHaveBeenCalledWith({
        where: {
          clientId: 1,
          saleDate: {
            gte: expect.any(Date),
          },
        },
        include: {
          saleDetails: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
      });
      expect(result.data.summary.totalPurchases).toBe(1);
    });

    it('should throw NotFoundException for non-existent client', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.generatePurchaseReport(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
