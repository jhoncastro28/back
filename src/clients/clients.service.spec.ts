import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';
import { CreateClientDto, ToggleActiveDto, UpdateClientDto } from './dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let prismaService: PrismaService;

  // Mock client data
  const mockClient: any = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
    documentType: 'CC',
    documentNumber: '1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock create client DTO
  const mockCreateClientDto: CreateClientDto = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1 555-123-4567',
    address: '123 Main St',
    documentType: 'CC' as any,
    documentNumber: '1234567890',
  };

  // Mock update client DTO
  const mockUpdateClientDto: UpdateClientDto = {
    email: 'updated.email@example.com',
  };

  // Mock toggle active DTO
  const mockToggleActiveDto: ToggleActiveDto = {
    isActive: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      jest.spyOn(prismaService.client, 'create').mockResolvedValue(mockClient);

      const result = await service.create(mockCreateClientDto);

      expect(prismaService.client.create).toHaveBeenCalledWith({
        data: mockCreateClientDto,
      });
      expect(result).toEqual({
        message: 'Client created successfully',
        client: mockClient,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const clients = [mockClient];
      const paginationDto = { page: 1, limit: 10 };

      jest.spyOn(prismaService.client, 'findMany').mockResolvedValue(clients);
      jest.spyOn(prismaService.client, 'count').mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      expect(prismaService.client.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        data: clients,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: 'Clients retrieved successfully',
      });
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
        client: mockClient,
        message: 'Client found successfully',
      });
    });

    it('should throw NotFoundException if client not found', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is inactive', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue({
        ...mockClient,
        isActive: false,
      });

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a client successfully', async () => {
      const updatedClient = {
        ...mockClient,
        email: 'updated.email@example.com',
      };

      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest
        .spyOn(prismaService.client, 'update')
        .mockResolvedValue(updatedClient);

      const result = await service.update(1, mockUpdateClientDto);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: mockUpdateClientDto,
      });
      expect(result).toEqual({
        message: 'Client updated successfully',
        client: updatedClient,
      });
    });

    it('should throw NotFoundException if client to update not found', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(service.update(999, mockUpdateClientDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if client is inactive', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue({
        ...mockClient,
        isActive: false,
      });

      await expect(service.update(1, mockUpdateClientDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleActive', () => {
    it('should deactivate a client successfully', async () => {
      const deactivatedClient = {
        ...mockClient,
        isActive: false,
      };

      jest
        .spyOn(prismaService.client, 'findUnique')
        .mockResolvedValue(mockClient);
      jest
        .spyOn(prismaService.client, 'update')
        .mockResolvedValue(deactivatedClient);

      const result = await service.toggleActive(1, mockToggleActiveDto);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          isActive: false,
        },
      });
      expect(result).toEqual({
        message: 'Client deactivated successfully',
        client: deactivatedClient,
      });
    });

    it('should throw NotFoundException if client to toggle not found', async () => {
      jest.spyOn(prismaService.client, 'findUnique').mockResolvedValue(null);

      await expect(
        service.toggleActive(999, mockToggleActiveDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
