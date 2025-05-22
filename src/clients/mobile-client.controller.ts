import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { ClientsService } from './clients.service';

@ApiTags('Mobile Client')
@Controller('mobile/client')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileClientController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({ summary: 'Get client orders (mobile app)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  @Get('orders')
  @HttpCode(HttpStatus.OK)
  getMyOrders(@Request() req) {
    if (req.user?.type !== 'client') {
      throw new UnauthorizedException(
        'This endpoint is only for mobile clients',
      );
    }

    return this.clientsService.getClientOrders(req.user.id);
  }

  @ApiOperation({ summary: 'Get specific order details (mobile app)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found or does not belong to client',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID', example: 1 })
  @Get('orders/:orderId')
  @HttpCode(HttpStatus.OK)
  getOrderDetails(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Request() req,
  ) {
    if (req.user?.type !== 'client') {
      throw new UnauthorizedException(
        'This endpoint is only for mobile clients',
      );
    }

    return this.clientsService.getClientOrderDetails(req.user.id, orderId);
  }

  @ApiOperation({ summary: 'Get client purchase history (mobile app)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase history retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starting from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @Get('purchase-history')
  @HttpCode(HttpStatus.OK)
  getPurchaseHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (req.user?.type !== 'client') {
      throw new UnauthorizedException(
        'This endpoint is only for mobile clients',
      );
    }

    return this.clientsService.getPurchaseHistory(req.user.id, {
      page,
      limit,
    });
  }
}
