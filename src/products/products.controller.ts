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
import { ToggleActiveService } from '../common/services/toggle-active.service';
import {
  AdjustStockDto,
  CreateProductDto,
  FilterProductDto,
  UpdateProductDto,
} from './dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly toggleActiveService: ToggleActiveService,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product list successfully retrieved',
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
    name: 'name',
    required: false,
    description: 'Filter by product name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active/inactive products',
  })
  @ApiQuery({
    name: 'supplierId',
    required: false,
    description: 'Filter by supplier ID',
  })
  findAll(@Query() filterProductDto: FilterProductDto) {
    return this.productsService.findAll(filterProductDto);
  }

  @Get('low-stock')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get products with low stock',
    description:
      'Returns products with stock levels below their minimum quantity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock products retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product found' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get(':id/price-history')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get price history for a product',
    description: 'Returns the complete history of price changes for a product',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price history retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  getPriceHistory(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getPriceHistory(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product or supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually adjust product stock',
    description:
      "Directly adjust a product's stock quantity (creates inventory movement record)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock successfully adjusted',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(id, adjustStockDto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a product (logical deletion)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product successfully deactivated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('product', id, {
      isActive: false,
    });
  }

  @Patch(':id/activate')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a product' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product successfully activated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiParam({ name: 'id', description: 'Product ID', example: 1 })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('product', id, {
      isActive: true,
    });
  }

  @Get('reports/stock-status')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate product stock status report',
    description:
      'Returns a comprehensive report of all products with their current stock levels, including alerts for low and high stock',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock status report generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Authentication required',
  })
  getStockStatusReport() {
    return this.productsService.generateStockStatusReport();
  }

  @Get('reports/sales-performance')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate product sales performance report',
    description:
      'Returns a report of product sales performance including top-selling products and revenue analysis',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales performance report generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date for the report period (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date for the report period (YYYY-MM-DD)',
  })
  getSalesPerformanceReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.productsService.generateSalesPerformanceReport(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('reports/price-changes')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate price changes report',
    description:
      'Returns a report of all price changes across products within a specified period',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Price changes report generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Administrators only',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date for the report period (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date for the report period (YYYY-MM-DD)',
  })
  getPriceChangesReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.productsService.generatePriceChangesReport(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
