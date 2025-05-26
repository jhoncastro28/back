import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '../auth/interfaces';
import {
  FullResponse,
  PaginatedResponse,
} from '../common/interfaces/response.interface';
import { InventoryReportQueryDto, MovementsReportQueryDto } from './dto';
import {
  InventoryMovementsReportResponse,
  InventoryReportResponse,
  InventorySummaryResponse,
} from './entities/inventory-report.entity';
import { InventoryReportsService } from './inventory-reports.service';

@ApiTags('Inventory Reports')
@Controller('inventory-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryReportsController {
  constructor(
    private readonly inventoryReportsService: InventoryReportsService,
  ) {}

  @Get('inventory/paginated')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated inventory report data',
    description:
      'Returns a paginated list of inventory items with their current status and values.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated inventory report data retrieved successfully',
    type: InventoryReportResponse,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  async getPaginatedInventoryReport(
    @Query() query: InventoryReportQueryDto,
  ): Promise<PaginatedResponse<InventoryReportResponse>> {
    return this.inventoryReportsService.getPaginatedInventoryReport(query);
  }

  @Get('inventory/full')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full inventory report data',
    description:
      'Returns a complete list of inventory items without pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Full inventory report data retrieved successfully',
    type: InventoryReportResponse,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  async getFullInventoryReport(
    @Query() query: Omit<InventoryReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<InventoryReportResponse>> {
    return this.inventoryReportsService.getFullInventoryReport(query);
  }

  @Get('movements/paginated')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated inventory movements report data',
    description:
      'Returns a paginated list of inventory movements with details about each transaction.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paginated inventory movements report data retrieved successfully',
    type: InventoryMovementsReportResponse,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  async getPaginatedMovementsReport(
    @Query() query: MovementsReportQueryDto,
  ): Promise<PaginatedResponse<InventoryMovementsReportResponse>> {
    return this.inventoryReportsService.getPaginatedMovementsReport(query);
  }

  @Get('movements/full')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get full inventory movements report data',
    description:
      'Returns a complete list of inventory movements without pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Full inventory movements report data retrieved successfully',
    type: InventoryMovementsReportResponse,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  async getFullMovementsReport(
    @Query() query: Omit<MovementsReportQueryDto, 'page' | 'limit'>,
  ): Promise<FullResponse<InventoryMovementsReportResponse>> {
    return this.inventoryReportsService.getFullMovementsReport(query);
  }

  @Get('summary')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get inventory summary statistics',
    description:
      'Returns key metrics and statistics about the current inventory state',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: InventorySummaryResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  async getInventorySummary(): Promise<InventorySummaryResponse> {
    return this.inventoryReportsService.getInventorySummary();
  }
}
