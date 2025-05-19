import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
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
import { CreatePriceDto, FilterPriceDto, UpdatePriceDto } from './dto';
import { PricesService } from './prices.service';

@ApiTags('Prices')
@Controller('prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricesController {
  constructor(
    private readonly pricesService: PricesService,
    private readonly toggleActiveService: ToggleActiveService,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create a new price' })
  @ApiResponse({ status: 201, description: 'Price successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  create(@Body() createPriceDto: CreatePriceDto) {
    return this.pricesService.create(createPriceDto);
  }

  @Get()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get paginated list of prices' })
  @ApiResponse({
    status: 200,
    description: 'Price list successfully retrieved',
  })
  @ApiResponse({
    status: 403,
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
    name: 'productId',
    required: false,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'isCurrentPrice',
    required: false,
    description: 'Filter by current price status',
  })
  findAll(@Query() filterPriceDto: FilterPriceDto) {
    return this.pricesService.findAll(filterPriceDto);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get a price by ID' })
  @ApiResponse({ status: 200, description: 'Price found' })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Price ID', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pricesService.findOne(id);
  }

  @Get('product/:productId/current')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get current price for a product' })
  @ApiResponse({ status: 200, description: 'Current price found' })
  @ApiResponse({ status: 404, description: 'Product or price not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID',
    example: 1,
  })
  getCurrentPriceForProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.pricesService.getCurrentPriceForProduct(productId);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update a price' })
  @ApiResponse({ status: 200, description: 'Price successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  @ApiParam({ name: 'id', description: 'Price ID', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriceDto: UpdatePriceDto,
  ) {
    return this.pricesService.update(id, updatePriceDto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Deactivate a price (logical deletion)' })
  @ApiResponse({ status: 200, description: 'Price successfully deactivated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate the current price',
  })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  @ApiParam({ name: 'id', description: 'Price ID', example: 1 })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('price', id, {
      isActive: false,
    });
  }

  @Patch(':id/activate')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Activate a price' })
  @ApiResponse({ status: 200, description: 'Price successfully activated' })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  @ApiParam({ name: 'id', description: 'Price ID', example: 1 })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('price', id, {
      isActive: true,
    });
  }
}
