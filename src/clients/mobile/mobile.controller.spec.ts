import { Test, TestingModule } from '@nestjs/testing';
import { DocumentType } from '../entities/client.entity';
import { MobileOrderDto } from './dto/mobile-order.dto';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';

describe('MobileController', () => {
  let controller: MobileController;
  let mobileService: MobileService;

  const mockUser = {
    id: 1,
    documentType: DocumentType.CC,
    documentNumber: '12345678',
  };

  const mockOrder = {
    id: '1',
    orderNumber: 'ORD-000001',
    date: '2024-03-20T10:00:00.000Z',
    status: 'completed' as const,
    items: [
      {
        id: '1',
        name: 'Product 1',
        quantity: 2,
        price: 10.5,
      },
    ],
    subtotal: 21.0,
    tax: 0,
    shipping: 0,
    total: 21.0,
    address: 'Test Address',
    paymentMethod: 'Cash',
  };

  const mockOrderDetail = {
    ...mockOrder,
    store: 'Almendros',
    discount: 0,
  };

  const mockPaginatedResponse = {
    data: [mockOrder],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: 'Orders retrieved successfully',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MobileController],
      providers: [
        {
          provide: MobileService,
          useValue: {
            getClientOrders: jest.fn().mockResolvedValue(mockPaginatedResponse),
            getOrderDetails: jest.fn().mockResolvedValue({
              data: mockOrderDetail,
              message: 'Order details retrieved successfully',
            }),
            getPurchaseHistory: jest
              .fn()
              .mockResolvedValue(mockPaginatedResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<MobileController>(MobileController);
    mobileService = module.get<MobileService>(MobileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(mobileService).toBeDefined();
  });

  describe('getMyOrders', () => {
    it('should return paginated orders for the authenticated client', async () => {
      const result = await controller.getMyOrders({ user: mockUser });
      expect(mobileService.getClientOrders).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getOrderDetails', () => {
    it('should return details for a specific order', async () => {
      const orderId = 1;
      const result = await controller.getOrderDetails(orderId, {
        user: mockUser,
      });
      expect(mobileService.getOrderDetails).toHaveBeenCalledWith(
        mockUser.id,
        orderId,
      );
      expect(result).toEqual({
        data: mockOrderDetail,
        message: 'Order details retrieved successfully',
      });
    });
  });

  describe('getPurchaseHistory', () => {
    it('should return paginated purchase history', async () => {
      const orderDto: MobileOrderDto = {
        page: 1,
        limit: 10,
        clientId: mockUser.id,
      };
      const result = await controller.getPurchaseHistory(
        { user: mockUser },
        orderDto,
      );
      expect(mobileService.getPurchaseHistory).toHaveBeenCalledWith(
        mockUser.id,
        orderDto,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle default pagination values', async () => {
      const orderDto: MobileOrderDto = { clientId: mockUser.id };
      const result = await controller.getPurchaseHistory(
        { user: mockUser },
        orderDto,
      );
      expect(mobileService.getPurchaseHistory).toHaveBeenCalledWith(
        mockUser.id,
        orderDto,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });
});
