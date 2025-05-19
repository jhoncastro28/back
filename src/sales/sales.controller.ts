import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../generated/prisma';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import {
  ClientPurchaseSummaryDto,
  ClientSalesResponseDto,
  CreateSaleDto,
  SaleResponseDto,
  UpdateSaleDto,
} from './dto/sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly toggleActiveService: ToggleActiveService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale with details' })
  @ApiResponse({
    status: 201,
    description: 'Sale created successfully',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createSaleDto: CreateSaleDto, @GetUser() user: any) {
    return this.salesService.create(createSaleDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({
    status: 200,
    description: 'Return all sales',
    type: [SaleResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'clientId', required: false, type: Number })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('clientId') clientId?: number,
  ) {
    return this.salesService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      startDate,
      endDate,
      clientId: clientId ? +clientId : undefined,
    });
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all purchases for a specific client' })
  @ApiResponse({
    status: 200,
    description: 'Return all purchases for the specified client with summary',
    type: ClientSalesResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Start date filter (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'End date filter (ISO format)',
  })
  @ApiQuery({
    name: 'includeDetails',
    required: false,
    type: Boolean,
    description: 'Include sale details (default: false)',
  })
  async findByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeDetails') includeDetails?: string,
  ) {
    return this.salesService.findByClient(clientId, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeDetails: includeDetails === 'true',
    });
  }

  @Get('client/:clientId/summary')
  @ApiOperation({ summary: 'Get purchase summary for a specific client' })
  @ApiResponse({
    status: 200,
    description: 'Return purchase summary statistics for the specified client',
    type: ClientPurchaseSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Start date filter (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'End date filter (ISO format)',
  })
  async getClientPurchaseSummary(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.getClientPurchaseSummary(
      clientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by id with details' })
  @ApiResponse({
    status: 200,
    description: 'Return the sale with details',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get sale details by sale id' })
  @ApiResponse({ status: 200, description: 'Return the sale details' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async getSaleDetails(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.getSaleDetails(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale' })
  @ApiResponse({
    status: 200,
    description: 'Sale updated successfully',
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(Role.ADMINISTRATOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a sale' })
  @ApiResponse({
    status: 200,
    description: 'Sale activated successfully',
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(Role.ADMINISTRATOR)
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('sale', id, {
      isActive: true,
    });
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a sale' })
  @ApiResponse({
    status: 200,
    description: 'Sale deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  @Roles(Role.ADMINISTRATOR)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('sale', id, {
      isActive: false,
    });
  }
}
