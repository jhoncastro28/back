import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../../generated/prisma';
import { Roles } from '../../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import {
  FullResponse,
  PaginatedResponse,
} from '../../common/interfaces/response.interface';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import {
  ClientSalesReport,
  DateSalesReport,
  ProductSalesReport,
  SalesReportResponse,
  SalesSummaryResponse,
} from './entities/sales-report.entity';
import { SalesReportService } from './sales-report.service';

/**
 * Controller for handling sales report generation and retrieval
 * Only accessible by administrators
 */
@ApiTags('Sales Reports')
@Controller('sales/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@ApiBearerAuth()
export class SalesReportController {
  constructor(private readonly salesReportService: SalesReportService) {}

  @Get('paginated')
  @ApiOperation({
    summary: 'Get paginated sales report',
    description: 'Returns a paginated list of sales with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated sales report',
    type: SalesReportResponse,
    isArray: true,
  })
  async getPaginatedSalesReport(
    @Query() query: SalesReportQueryDto,
  ): Promise<PaginatedResponse<SalesReportResponse>> {
    return this.salesReportService.getPaginatedSalesReport(query);
  }

  @Get('full')
  @ApiOperation({
    summary: 'Get full sales report',
    description: 'Returns a complete list of sales without pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a full sales report',
    type: SalesReportResponse,
    isArray: true,
  })
  async getFullSalesReport(
    @Query() query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<SalesReportResponse>> {
    return this.salesReportService.getFullSalesReport(query);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get sales summary statistics',
    description:
      'Returns aggregated sales statistics for the specified period.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns aggregated sales statistics including totals and averages.',
    type: SalesSummaryResponse,
  })
  getSalesSummary(
    @Query() query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<SalesSummaryResponse> {
    return this.salesReportService.getSalesSummary(query);
  }

  @Get('by-product')
  @ApiOperation({
    summary: 'Get sales grouped by product',
    description:
      'Returns sales data aggregated by product with detailed statistics.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns sales data grouped by product with totals and averages.',
    type: ProductSalesReport,
    isArray: true,
  })
  getSalesByProduct(
    @Query() query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<ProductSalesReport[]> {
    return this.salesReportService.getSalesByProduct(query);
  }

  @Get('by-client')
  @ApiOperation({
    summary: 'Get sales grouped by client',
    description:
      'Returns sales data aggregated by client with detailed statistics.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns sales data grouped by client with totals and averages.',
    type: ClientSalesReport,
    isArray: true,
  })
  getSalesByClient(
    @Query() query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<ClientSalesReport[]> {
    return this.salesReportService.getSalesByClient(query);
  }

  @Get('by-date')
  @ApiOperation({
    summary: 'Get sales grouped by date',
    description:
      'Returns sales data aggregated by date with detailed statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns sales data grouped by date with totals and averages.',
    type: DateSalesReport,
    isArray: true,
  })
  getSalesByDate(
    @Query() query: Omit<SalesReportQueryDto, 'page' | 'limit'>,
  ): Promise<DateSalesReport[]> {
    return this.salesReportService.getSalesByDate(query);
  }
}
