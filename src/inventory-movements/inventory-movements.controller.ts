import {
  Body,
  Controller,
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
import { GetUser, Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '../auth/interfaces';
import {
  CreateInventoryMovementDto,
  FilterInventoryMovementDto,
  UpdateInventoryMovementDto,
} from './dto';
import { MovementType } from './dto/inventory-movement.types';
import {
  InventoryMovementResponseEntity,
  PaginatedInventoryMovementsResponseEntity,
} from './entities';
import { InventoryMovementsService } from './inventory-movements.service';

@ApiTags('Inventory Movements')
@Controller('inventory-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new inventory movement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Movement successfully created',
    type: InventoryMovementResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product, supplier, or sale not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  create(
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
    @GetUser('id') userId: string,
  ) {
    return this.inventoryMovementsService.create(
      createInventoryMovementDto,
      userId,
    );
  }

  @Get()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of inventory movements' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory movements list successfully retrieved',
    type: PaginatedInventoryMovementsResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts at 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by movement type',
    enum: MovementType,
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    description: 'Filter by supplier ID',
  })
  @ApiQuery({
    name: 'saleId',
    required: false,
    description: 'Filter by sale ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter by date range (from)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter by date range (to)',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Filter by reason (partial match)',
  })
  findAll(@Query() filterInventoryMovementDto: FilterInventoryMovementDto) {
    return this.inventoryMovementsService.findAll(filterInventoryMovementDto);
  }

  @Get('stock-alert')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get products with stock alerts',
    description:
      'Returns a list of products that have stock levels below their defined minimum quantity or above their maximum quantity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock alert list retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  getStockAlerts() {
    return this.inventoryMovementsService.getStockAlerts();
  }

  @Get('products/:productId')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get movement history for a specific product' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product movement history retrieved',
    type: PaginatedInventoryMovementsResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID',
    example: 1,
  })
  getProductMovementsHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() filters: FilterInventoryMovementDto,
  ) {
    return this.inventoryMovementsService.getProductMovementsHistory(
      productId,
      filters,
    );
  }

  @Get('report/stock-transactions')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate stock transactions report',
    description:
      'Returns a report of stock movements within a specific date range',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: true,
    description: 'Start date for the report',
  })
  @ApiQuery({
    name: 'dateTo',
    required: true,
    description: 'End date for the report',
  })
  generateStockTransactionsReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.inventoryMovementsService.generateStockTransactionsReport(
      new Date(dateFrom),
      new Date(dateTo),
    );
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory movement by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Movement found',
    type: InventoryMovementResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Movement not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Movement ID', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryMovementsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an inventory movement (only notes and reason)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Movement successfully updated',
    type: InventoryMovementResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Movement not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiParam({ name: 'id', description: 'Movement ID', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryMovementDto: UpdateInventoryMovementDto,
  ) {
    return this.inventoryMovementsService.update(
      id,
      updateInventoryMovementDto,
    );
  }
}
