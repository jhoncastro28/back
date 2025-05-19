import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators';
import { Role } from '../auth/interfaces';
import { GenerateReportDto } from './dto/inventory-report.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { InventoryReportsService } from './inventory-reports.service';

@ApiTags('Inventory Reports')
@Controller('inventory-reports')
export class InventoryReportsController {
  constructor(
    private readonly inventoryReportsService: InventoryReportsService,
  ) {}

  @ApiOperation({ summary: 'Get inventory report query for client execution' })
  @ApiResponse({
    status: 200,
    description: 'Query generated successfully',
    type: QueryParamsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Post('query')
  async getReportQuery(
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<QueryParamsDto> {
    return this.inventoryReportsService.generateReportQuery(generateReportDto);
  }

  @ApiOperation({ summary: 'Get inventory summary query for client execution' })
  @ApiResponse({
    status: 200,
    description: 'Summary query generated successfully',
    type: QueryParamsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBearerAuth()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Post('summary-query')
  async getInventorySummaryQuery(): Promise<QueryParamsDto> {
    return this.inventoryReportsService.getInventorySummaryQuery();
  }
}
