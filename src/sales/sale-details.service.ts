import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSaleDetailDto,
  UpdateSaleDetailDto,
} from './dto/sale-detail.dto';

@Injectable()
export class SaleDetailsService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDetailDto: CreateSaleDetailDto) {
    const { productId, quantity, unitPrice, discountAmount } =
      createSaleDetailDto;

    // Verify if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Calculate subtotal
    const subtotal = unitPrice * quantity - (discountAmount || 0);

    // Create sale detail
    const saleDetail = await this.prisma.saleDetail.create({
      data: {
        quantity,
        unitPrice,
        discountAmount,
        subtotal,
        product: {
          connect: { id: productId },
        },
        sale: {
          connect: { id: 1 }, // O el ID de venta que necesites
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return saleDetail;
  }

  async findOne(id: number) {
    const saleDetail = await this.prisma.saleDetail.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sale: {
          select: {
            id: true,
            saleDate: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!saleDetail) {
      throw new NotFoundException(`Sale detail with id ${id} not found`);
    }

    return saleDetail;
  }

  async update(id: number, updateSaleDetailDto: UpdateSaleDetailDto) {
    // Check if sale detail exists
    const saleDetail = await this.prisma.saleDetail.findUnique({
      where: { id },
    });

    if (!saleDetail) {
      throw new NotFoundException(`Sale detail with id ${id} not found`);
    }

    // Prepare update data
    const data: any = { ...updateSaleDetailDto };

    // If quantity or unit price is updated, recalculate subtotal
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const quantity =
        data.quantity !== undefined ? data.quantity : saleDetail.quantity;
      const unitPrice =
        data.unitPrice !== undefined ? data.unitPrice : saleDetail.unitPrice;
      const discountAmount =
        data.discountAmount !== undefined
          ? data.discountAmount
          : saleDetail.discountAmount;

      data.subtotal = unitPrice * quantity - (discountAmount || 0);
    }

    // If product is changed, check if it exists
    if (data.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${data.productId} not found`,
        );
      }
    }

    // Update sale detail
    return this.prisma.$transaction(async (prisma) => {
      // Update the sale detail
      const updatedSaleDetail = await prisma.saleDetail.update({
        where: { id },
        data,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // Recalculate the total amount of the associated sale
      const saleDetails = await prisma.saleDetail.findMany({
        where: { saleId: saleDetail.saleId },
      });

      const totalAmount = saleDetails.reduce(
        (sum, detail) => sum + Number(detail.subtotal),
        0,
      );

      // Update the sale's total amount
      await prisma.sale.update({
        where: { id: saleDetail.saleId },
        data: { totalAmount },
      });

      return updatedSaleDetail;
    });
  }

  async remove(id: number) {
    // Check if sale detail exists
    const saleDetail = await this.prisma.saleDetail.findUnique({
      where: { id },
    });

    if (!saleDetail) {
      throw new NotFoundException(`Sale detail with id ${id} not found`);
    }

    // Remove the sale detail and update the sale's total amount
    return this.prisma.$transaction(async (prisma) => {
      // Delete the sale detail
      const deletedSaleDetail = await prisma.saleDetail.delete({
        where: { id },
      });

      // Get remaining sale details for this sale
      const remainingSaleDetails = await prisma.saleDetail.findMany({
        where: { saleId: saleDetail.saleId },
      });

      // Recalculate the total amount
      const totalAmount = remainingSaleDetails.reduce(
        (sum, detail) => sum + Number(detail.subtotal),
        0,
      );

      // Update the sale's total amount
      await prisma.sale.update({
        where: { id: saleDetail.saleId },
        data: { totalAmount },
      });

      return deletedSaleDetail;
    });
  }
}
