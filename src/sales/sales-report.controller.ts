import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SalesReportService } from './sales-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';

@ApiTags('sales-report')
@Controller('sales-report')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesReportController {
  constructor(private readonly salesReportService: SalesReportService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get sales summary' })
  @ApiResponse({ status: 200, description: 'Return sales summary' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getSalesSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesReportService.getSalesSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('by-product')
  @ApiOperation({ summary: 'Get sales by product' })
  @ApiResponse({ status: 200, description: 'Return sales by product' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSalesByProduct(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.salesReportService.getSalesByProduct(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? +limit : 10,
    );
  }

  @Get('by-client')
  @ApiOperation({ summary: 'Get sales by client' })
  @ApiResponse({ status: 200, description: 'Return sales by client' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSalesByClient(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.salesReportService.getSalesByClient(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit ? +limit : 10,
    );
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get sales by date' })
  @ApiResponse({ status: 200, description: 'Return sales by date' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  async getSalesByDate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.salesReportService.getSalesByDate(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      groupBy,
    );
  }

  @Get('product/:id')
  @ApiOperation({ summary: 'Get sales history for a specific product' })
  @ApiResponse({ status: 200, description: 'Return sales history for product' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getProductSalesHistory(
    @Param('id', ParseIntPipe) productId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesReportService.getProductSalesHistory(
      productId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
