import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { PaginationService } from '../../common/services/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MobileOrderDto } from './dto/mobile-order.dto';
import {
  MobileOrder,
  MobileOrderDetail,
} from './interfaces/mobile-order.interface';

@Injectable()
export class MobileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Retrieves all orders for a specific client
   * @param clientId - The unique identifier of the client
   * @returns A paginated response containing the client's orders
   * @throws NotFoundException when client is not found or inactive
   */
  async getClientOrders(
    clientId: number,
  ): Promise<PaginatedResponse<MobileOrder>> {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(
        `Client with ID ${clientId} not found or inactive`,
      );
    }

    const sales = await this.prismaService.sale.findMany({
      where: { clientId },
      include: {
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { saleDate: 'desc' },
    });

    const orders = sales.map((sale) => ({
      id: sale.id.toString(),
      orderNumber: `ORD-${sale.id.toString().padStart(6, '0')}`,
      date: sale.saleDate.toISOString(),
      status: 'completed' as const,
      items: sale.saleDetails.map((detail) => ({
        id: detail.id.toString(),
        name: detail.product.name,
        quantity: detail.quantity,
        price: Number(detail.unitPrice),
      })),
      subtotal: Number(sale.totalAmount),
      tax: 0,
      shipping: 0,
      total: Number(sale.totalAmount),
      address: client.address || 'No address provided',
      paymentMethod: 'Cash',
    }));

    return this.paginationService.createPaginationObject(
      orders,
      orders.length,
      1,
      orders.length,
      'Orders retrieved successfully',
    );
  }

  /**
   * Retrieves detailed information for a specific order
   * @param clientId - The unique identifier of the client
   * @param orderId - The unique identifier of the order
   * @returns Detailed information about the order
   * @throws NotFoundException when client or order is not found
   */
  async getOrderDetails(
    clientId: number,
    orderId: number,
  ): Promise<{ data: MobileOrderDetail; message: string }> {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(
        `Client with ID ${clientId} not found or inactive`,
      );
    }

    const sale = await this.prismaService.sale.findFirst({
      where: {
        id: orderId,
        clientId,
      },
      include: {
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(
        `Order with ID ${orderId} not found or does not belong to this client`,
      );
    }

    const orderDetail: MobileOrderDetail = {
      id: sale.id.toString(),
      orderNumber: `ORD-${sale.id.toString().padStart(6, '0')}`,
      date: sale.saleDate.toISOString(),
      status: 'completed',
      items: sale.saleDetails.map((detail) => ({
        id: detail.id.toString(),
        name: detail.product.name,
        quantity: detail.quantity,
        price: Number(detail.unitPrice),
      })),
      subtotal: Number(sale.totalAmount),
      tax: 0,
      shipping: 0,
      discount: 0,
      total: Number(sale.totalAmount),
      address: client.address || 'No address provided',
      paymentMethod: 'Cash',
      store: 'Almendros',
    };

    return {
      data: orderDetail,
      message: 'Order details retrieved successfully',
    };
  }

  /**
   * Retrieves the purchase history for a client with pagination
   * @param clientId - The unique identifier of the client
   * @param options - Pagination options including page and limit
   * @returns A paginated response containing the client's purchase history
   * @throws NotFoundException when client is not found or inactive
   */
  async getPurchaseHistory(
    clientId: number,
    { page = 1, limit = 10 }: MobileOrderDto,
  ): Promise<PaginatedResponse<MobileOrder>> {
    const client = await this.prismaService.client.findUnique({
      where: { id: clientId },
    });

    if (!client || !client.isActive) {
      throw new NotFoundException(
        `Client with ID ${clientId} not found or inactive`,
      );
    }

    const skip = this.paginationService.getPaginationSkip(page, limit);

    const [sales, total] = await Promise.all([
      this.prismaService.sale.findMany({
        where: { clientId },
        include: {
          saleDetails: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { saleDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.sale.count({
        where: { clientId },
      }),
    ]);

    const orders = sales.map((sale) => ({
      id: sale.id.toString(),
      orderNumber: `ORD-${sale.id.toString().padStart(6, '0')}`,
      date: sale.saleDate.toISOString(),
      status: 'completed' as const,
      items: sale.saleDetails.map((detail) => ({
        id: detail.id.toString(),
        name: detail.product.name,
        quantity: detail.quantity,
        price: Number(detail.unitPrice),
      })),
      subtotal: Number(sale.totalAmount),
      tax: 0,
      shipping: 0,
      total: Number(sale.totalAmount),
      address: client.address || 'No address provided',
      paymentMethod: 'Cash',
    }));

    return this.paginationService.createPaginationObject(
      orders,
      total,
      page,
      limit,
      'Purchase history retrieved successfully',
    );
  }
}
