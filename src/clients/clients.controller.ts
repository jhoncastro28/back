import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '../auth/interfaces';
import { ClientsService } from './clients.service';
import { CreateClientDto, FilterClientDto, UpdateClientDto } from './dto';
import { ClientResponse, PaginatedClientsResponse } from './entities';

/**
 * Clients Controller
 *
 * Handles HTTP requests related to client management
 */
@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Create a new client
   */
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Client created successfully',
    type: ClientResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid client data provided',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Get all clients with pagination
   */
  @ApiOperation({ summary: 'Get all clients with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clients retrieved successfully',
    type: PaginatedClientsResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid pagination parameters',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
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
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by client name',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by client email',
  })
  @ApiQuery({
    name: 'phoneNumber',
    required: false,
    type: String,
    description: 'Filter by client phone number',
  })
  @ApiQuery({
    name: 'identificationNumber',
    required: false,
    type: String,
    description: 'Filter by client identification number',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active/inactive status',
  })
  @ApiQuery({
    name: 'hasPurchased',
    required: false,
    type: Boolean,
    description: 'Filter clients who have made at least one purchase',
  })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() filterClientDto: FilterClientDto) {
    return this.clientsService.findAll(filterClientDto);
  }

  /**
   * Get client by ID
   */
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client found successfully',
    type: ClientResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found or inactive',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 1 })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  /**
   * Get purchase history for a client
   */
  @ApiOperation({
    summary: 'Get client purchase history',
    description:
      'Retrieves the purchase history for a specific client with detailed product information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase history retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found or inactive',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 1 })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter by purchase date range (from)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter by purchase date range (to)',
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
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get(':id/purchase-history')
  @HttpCode(HttpStatus.OK)
  getPurchaseHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.clientsService.getPurchaseHistory(id, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
    });
  }

  /**
   * Get purchase summary report for a client
   */
  @ApiOperation({
    summary: 'Get client purchase summary report',
    description:
      'Generates a summary report of client purchases including favorite products and spending patterns',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase summary report generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found or inactive',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 1 })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year', 'all'],
    description: 'Time period for the report',
  })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Get(':id/purchase-report')
  @HttpCode(HttpStatus.OK)
  getPurchaseReport(
    @Param('id', ParseIntPipe) id: number,
    @Query('period') period: 'month' | 'quarter' | 'year' | 'all' = 'all',
  ) {
    return this.clientsService.generatePurchaseReport(id, period);
  }

  /**
   * Update client information
   */
  @ApiOperation({ summary: 'Update client information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client updated successfully',
    type: ClientResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found or inactive',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid client data or ID format',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 1 })
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  /**
   * Deactivate a client (logical deletion)
   * Restricted to administrators
   */
  @ApiOperation({ summary: 'Deactivate client (logical deletion)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client successfully deactivated',
    type: ClientResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  @ApiParam({ name: 'id', description: 'Client ID', example: 1 })
  @Roles(Role.ADMINISTRATOR)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.toggleActive(id, { isActive: false });
  }
}
